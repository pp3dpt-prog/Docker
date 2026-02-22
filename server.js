const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(express.json());
app.use(cors());

// Configuração Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

app.post('/generate-stl', async (req, res) => {
    const { 
        forma, largura, altura, nome, telefone, temNFC, 
        tamFonte, tamFonteVerso, posTextoFrenteH, posTextoFrenteV, 
        posTextoVersoH, posTextoVersoV, alturaArgola 
    } = req.body;

    // Garante um nome de ficheiro limpo
    const nomeLimpo = (nome || "MEDALHA").replace(/\s+/g, '_');
    const filename = `medalha_${nomeLimpo}_${Date.now()}.stl`;
    const tempScad = `temp_${Date.now()}.scad`;

    const scadCode = `
$fn = 60;
fator_pos = 0.25; 

module forma_base(f, w, h, d) {
    if (f == "osso") {
        union() {
            cube([w*0.6, h*0.8, d], center=true);
            translate([w*0.3, h*0.3, 0]) cylinder(h=d, d=h*0.6, center=true);
            translate([w*0.3, -h*0.3, 0]) cylinder(h=d, d=h*0.6, center=true);
            translate([-w*0.3, h*0.3, 0]) cylinder(h=d, d=h*0.6, center=true);
            translate([-w*0.3, -h*0.3, 0]) cylinder(h=d, d=h*0.6, center=true);
        }
    } else if (f == "coracao") {
        linear_extrude(height=d, center=true) scale([w/25, h/25]) union() {
            circle(d=15); translate([7.5,0,0]) circle(d=15); rotate([0,0,45]) square([15,15]);
        }
    } else if (f == "hexagono") {
        rotate([0,0,30]) cylinder(h=d, d=w, $fn=6, center=true);
    } else if (f == "circular") {
        cylinder(h=d, d=w, center=true);
    } else if (f == "losangulo") {
        linear_extrude(height=d, center=true) polygon(points=[[0, h/2], [w/2, 0], [0, -h/2], [-w/2, 0]]);
    } else if (f == "escudo") {
        union() {
            cube([w, h*0.6, d], center=true);
            translate([0, -h*0.3, 0]) intersection() {
                cube([w, h, d], center=true);
                scale([1, 1.2, 1]) cylinder(h=d, d=w, center=true);
            }
        }
    } else {
        linear_extrude(height=d, center=true) offset(r=2) square([w-4, h-4], center=true);
    }
}

union() {
    difference() {
        union() {
            forma_base("${forma}", ${largura}, ${altura}, 4);
            translate([0, (${alturaArgola}/2), 0]) cylinder(h=4, d=8, center=true);
        }
        translate([0, (${alturaArgola}/2), -5]) cylinder(h=10, d=4.4);

        if (${temNFC}) {
            translate([0, 0, -2.1]) cylinder(d=25.5, h=2.2, center=false);
            translate([${posTextoVersoH}*fator_pos, ${posTextoVersoV}*fator_pos, -2.1])
                mirror([1,0,0]) linear_extrude(height=1.2)
                    text("NFC", size=4, halign="center", valign="center");
        } else {
            translate([${posTextoVersoH}*fator_pos, ${posTextoVersoV}*fator_pos, -2.1])
                mirror([1,0,0]) linear_extrude(height=1.25)
                    text("${telefone}", size=(${tamFonteVerso || 30}/10), halign="center", valign="center", font="Liberation Sans:style=Bold");
        }
    }
    color("white")
    translate([${posTextoFrenteH}*fator_pos, ${posTextoFrenteV}*fator_pos, 2])
        linear_extrude(height=1.5)
            text("${nome}", size=(${tamFonte}/4), halign="center", valign="center", font="Liberation Sans:style=Bold");
}
`;

    try {
        fs.writeFileSync(tempScad, scadCode);
        // Comando xvfb-run para ambiente Docker no Render
        const cmd = `xvfb-run -a -s "-screen 0 640x480x24" openscad -o ${filename} ${tempScad}`;
        
        exec(cmd, async (error) => {
            if (error) {
                console.error("Erro OpenSCAD:", error);
                return res.status(500).json({ error: "Falha na geração 3D" });
            }

            try {
                const fileBuffer = fs.readFileSync(filename);
                
                // Upload para o bucket 'medalhas' no Supabase
                const { data, error: uploadError } = await supabase.storage
                    .from('medalhas')
                    .upload(`stls/${filename}`, fileBuffer, { 
                        contentType: 'model/stl',
                        upsert: true 
                    });

                if (uploadError) throw uploadError;

                console.log("✅ Upload concluído:", filename);

                // Limpeza
                if (fs.existsSync(tempScad)) fs.unlinkSync(tempScad);
                if (fs.existsSync(filename)) fs.unlinkSync(filename);

                res.status(200).json({ success: true, file: data.path });

            } catch (upErr) {
                console.error("Erro no Upload:", upErr.message);
                res.status(500).json({ error: upErr.message });
            }
        });
    } catch (err) {
        console.error("Erro interno:", err);
        res.status(500).send("Erro no servidor");
    }
});

const port = process.env.PORT || 10000;
app.listen(port, '0.0.0.0', () => console.log(`🚀 Motor 3D online na porta ${port}`));