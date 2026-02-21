const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(express.json());
app.use(cors());

// Rota de saúde para o Render
app.get('/', (req, res) => {
    res.send('Servidor de Medalhas 3D está ONLINE! 🚀');
});

// Configuração Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ ERRO: Variáveis de ambiente não configuradas!");
}

const supabase = createClient(supabaseUrl, supabaseKey);

app.post('/generate-stl', (req, res) => {
    // 1. Extrair dados do corpo primeiro
    const { 
        nome, largura, altura, temNFC, 
        tamanhoFonte, nomePosX, nomePosY, 
        nfcPosX, nfcPosY 
    } = req.body;
    
    // 2. Definir o nome do ficheiro
    const filename = `medalha_${nome.replace(/\s+/g, '_')}_${Date.now()}.stl`;

    // 3. Comando corrigido com xvfb-run isolado para o OpenSCAD
    const cmd = `xvfb-run -a -s "-screen 0 640x480x24" openscad -o ${filename} \
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

            // Upload para Supabase Storage
            const { data, error: uploadError } = await supabase.storage
                .from('medalhas')
                .upload(`stls/${filename}`, fileBuffer, {
                    contentType: 'model/stl',
                    upsert: true
                });

            if (uploadError) throw uploadError;

            // Registo na base de dados
            const { error: dbError } = await supabase
                .from('pedidos_tags')
                .insert([{ 
                    nome_pet: nome, 
                    stl_path: data.path,
                    criado_em: new Date() 
                }]);

            if (dbError) console.error("⚠️ Erro na BD:", dbError);

            // Limpar ficheiro local após upload bem-sucedido
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