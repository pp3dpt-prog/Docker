const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const app = express();
app.use(express.json());

app.post('/generate-stl', (req, res) => {
    // Adicionamos 'posIconeV' (ou outro nome que prefiras no React)
    const { nome, largura, altura, temNFC, posIconeV } = req.body;
    
    const filename = `tag_${Date.now()}.stl`;

    // Injetamos a variável no comando com o sinal -D
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
    exec(cmd, (error) => {
        if (error) return res.status(500).send(error);
        
        // Aqui podes fazer upload para o Supabase ou enviar o ficheiro direto
        res.download(filename, () => {
            fs.unlinkSync(filename); // Apaga o ficheiro temporário
        });
    });
});

app.listen(3000, () => console.log('Engine 3D rodando na porta 3000'));