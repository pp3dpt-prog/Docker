// ==========================================
// PARÂMETROS DINÂMICOS (Vêm do POST da App)
// ==========================================
$fn = 60;
fator_pos = 0.25; // Sincronização /4 do Scene3D.jsx

module gerar_base(f, w, h, d) {
    if (f == "osso") {
        union() {
            cube([w*0.6, h*0.8, d], center=true);
            translate([w*0.3, h*0.3, 0]) cylinder(h=d, d=h*0.6, center=true);
            translate([w*0.3, -h*0.3, 0]) cylinder(h=d, d=h*0.6, center=true);
            translate([-w*0.3, h*0.3, 0]) cylinder(h=d, d=h*0.6, center=true);
            translate([-w*0.3, -h*0.3, 0]) cylinder(h=d, d=h*0.6, center=true);
        }
    } 
    else if (f == "coracao") {
        // Mimetiza a lógica de curvas do Three.js
        linear_extrude(height=d, center=true)
        scale([w/25, h/25])
        union() {
            circle(d=15);
            translate([7.5,0,0]) circle(d=15);
            rotate([0,0,45]) square([15,15]);
        }
    }
    else if (f == "hexagono") {
        rotate([0,0,30]) cylinder(h=d, d=w, $fn=6, center=true);
    }
    else if (f == "circular") {
        cylinder(h=d, d=w, center=true);
    }
    else if (f == "escudo") {
        union() {
            cube([w, h*0.6, d], center=true);
            translate([0, -h*0.3, 0])
                intersection() {
                    cube([w, h, d], center=true);
                    scale([1, 1.2, 1]) cylinder(h=d, d=w, center=true);
                }
        }
    }
    else if (f == "losangulo") {
        linear_extrude(height=d, center=true)
            polygon(points=[[0, h/2], [w/2, 0], [0, -h/2], [-w/2, 0]]);
    }
    // FORMA ÚNICA DE RETÂNGULO (Vertical ou Horizontal)
    else if (f == "retangulo" || f == "retangulo_v" || f == "retangulo_h") {
        linear_extrude(height=d, center=true)
            offset(r=2) square([w-4, h-4], center=true);
    }
}

// --- CONSTRUÇÃO FINAL ---
union() {
    difference() {
        // 1. Corpo da Medalha
        gerar_base(forma, largura, altura, profundidade);
        
        // 2. Furo da Argola (Centralizado no topo)
        translate([0, (altura/2) - 4, -profundidade])
            cylinder(h=profundidade*3, d=3.5);

        // 3. Verso: Escavação (NFC ou Telefone)
        if (temNFC) {
            translate([posTextoVersoH * fator_pos, posTextoVersoV * fator_pos, -profundidade/2 - 0.1])
                mirror([1,0,0])
                linear_extrude(height = 1.2)
                    resize([12, 0], auto=true) import("nfc-icon.svg", center=true);
        } else {
            translate([posTextoVersoH * fator_pos, posTextoVersoV * fator_pos, -profundidade/2 + 0.5])
                mirror([1,0,0]) 
                linear_extrude(height = 1.1)
                    text(telefone, size = (tamFonteVerso/10), halign="center", valign="center", font="Liberation Sans:style=Bold");
        }
    }

    // 4. Frente: Nome em Relevo (Adição)
    translate([posTextoFrenteH * fator_pos, posTextoFrenteV * fator_pos, profundidade/2 - 0.1])
        linear_extrude(height = 1.5)
            text(nome, size = (tamFonte/4), halign="center", valign="center", font="Liberation Sans:style=Bold");
}