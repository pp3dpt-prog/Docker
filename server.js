const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const cors = require('cors');
// ADICIONADO: Importar a biblioteca do Supabase
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(express.json());
app.use(cors());

// Rota simples para o Render saber que o servidor está vivo
app.get('/', (req, res) => {
    res.send('Servidor de Medalhas 3D está ONLINE! 🚀');
});

// 1. Configuração Supabase (Lidas das variáveis de ambiente do Render)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Verificação de segurança
if (!supabaseUrl || !supabaseKey) {
    console.error("❌ ERRO: Variáveis SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configuradas!");
}

// MOVIDO PARA AQUI: Criar o cliente apenas depois de ter as chaves e a biblioteca
const supabase = createClient(supabaseUrl, supabaseKey);

app.post('/generate-stl', (req, res) => {
    const { 
        nome, largura, altura, temNFC, 
        tamanhoFonte, nomePosX, nomePosY, 
        nfcPosX, nfcPosY 
    } = req.body;
    
    const filename = `medalha_${nome.replace(/\s+/g, '_')}_${Date.now()}.stl`;

    const cmd = `xvfb-run openscad -o ${filename} \
    -D 'nome="${nome}"' \
    -D 'largura=${largura}' \
    -D 'altura=${altura}' \
    -D 'temNFC=${temNFC}' \
    -D 'tamanhoFonte=${tamanhoFonte}' \
    -D 'nomePosX=${nomePosX}' \
    -D 'nomePosY=${nomePosY}' \
    -D 'nfcPosX=${nfcPosX}' \
    -D 'nfcPosY=${nfcPosY}' \
    template.scad`;

    console.log(`🛠️ A gerar ficheiro: ${filename}`);

    exec(cmd, async (error, stdout, stderr) => {
        if (error) {
            console.error(`❌ Erro OpenSCAD: ${error}`);
            return res.status(500).json({ error: "Falha ao gerar geometria 3D" });
        }

        try {
            const fileBuffer = fs.readFileSync(`./${filename}`);

            // Upload para o Bucket 'medalhas' que já criaste
            const { data, error: uploadError } = await supabase.storage
                .from('medalhas')
                .upload(`stls/${filename}`, fileBuffer, {
                    contentType: 'model/stl',
                    upsert: true
                });

            if (uploadError) throw uploadError;

            // Inserir registo na BD
            const { error: dbError } = await supabase
                .from('pedidos_tags')
                .insert([{ 
                    nome_pet: nome, 
                    stl_path: data.path,
                    criado_em: new Date() 
                }]);

            if (dbError) console.error("⚠️ Erro na BD:", dbError);

            if (fs.existsSync(`./${filename}`)) fs.unlinkSync(`./${filename}`);

            res.status(200).json({ 
                success: true, 
                message: "Ficheiro guardado com sucesso!",
                file: data.path 
            });

        } catch (err) {
            console.error("❌ Erro final:", err);
            if (fs.existsSync(`./${filename}`)) fs.unlinkSync(`./${filename}`);
            res.status(500).json({ error: "Erro ao processar ficheiro" });
        }
    });
});

const port = process.env.PORT || 3000;
app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Motor 3D online na porta ${port}`);
});