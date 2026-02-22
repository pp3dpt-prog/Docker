// ==========================================
// PARÂMETROS DINÂMICOS (Enviados pelo Servidor)
// ==========================================
$fn = 100;
fator_pos = 0.25; 

// --- GEOMETRIAS PRECISAS (Unificação Modelo + Template) ---
module gerar_base(f, w, h, d) {
    // Convertendo para o sistema de coordenadas da App (onde w e h são metades)
    w_half = w / 2;
    h_half = h / 2;

    if (f == "osso") {
        union() {
            // O retângulo central (mesmas proporções da App: w*0.6 e h*0.8)
            cube([w_half * 1.2, h_half * 1.6, d], center=true);
            
            // Os 4 círculos das extremidades (diâmetro h*1.2 como na App)
            // Posicionados em w*0.3 e h*0.3
            translate([w_half * 0.6, h_half * 0.6, 0])  cylinder(h=d, d=h_half * 1.2, center=true);
            translate([w_half * 0.6, -h_half * 0.6, 0]) cylinder(h=d, d=h_half * 1.2, center=true);
            translate([-w_half * 0.6, h_half * 0.6, 0]) cylinder(h=d, d=h_half * 1.2, center=true);
            translate([-w_half * 0.6, -h_half * 0.6, 0]) cylinder(h=d, d=h_half * 1.2, center=true);
        }
    } 
    else if (f == "coracao") {
        linear_extrude(height=d, center=true) scale([w/25, h/25]) union() {
            circle(d=15); translate([7.5,0,0]) circle(d=15);
            rotate([0,0,45]) square([15,15]);
        }
    } 
    else if (f == "hexagono") {
        rotate([0,0,30]) cylinder(h=d, d=w, $fn=6, center=true);
    } 
    else if (f == "circular") {
        cylinder(h=d, d=w, center=true);
    } 
    else if (f == "losangulo") {
        linear_extrude(height=d, center=true)
        polygon(points=[[0, h/2], [w/2, 0], [0, -h/2], [-w/2, 0]]);
    } 
    else if (f == "escudo") {
        union() {
            cube([w, h*0.6, d], center=true);
            translate([0, -h*0.3, 0]) intersection() {
                cube([w, h, d], center=true);
                scale([1, 1.2, 1]) cylinder(h=d, d=w, center=true);
            }
        }
    } 
    else { // Retângulos
        linear_extrude(height=d, center=true) offset(r=2) square([w-4, h-4], center=true);
    }
}

// --- CONSTRUÇÃO FINAL (CORTE EM SANDUÍCHE) ---
union() {
    gerar_base(forma, largura, altura, 3.4);
    // Olhal posicionado acima da borda superior (altura/2)
    translate([0, (altura/2) + 2, 0]) 
        difference() {
            // No bloco difference() do final do ficheiro:
            translate([0, (altura/2) - 4, 0])
                cylinder(h=10, d=3.5, center=true);
        }


        // 3. CAVIDADE DO CHIP (Centralizada em X, Y e Z)
        // O chip de 25mm fica num buraco de 25.1mm.
        // Espessura do chip: 1mm. Fica entre Z -0.5 e Z +0.5.
        if (temNFC) {
            cylinder(d=25.1, h=1.1, center=true);
        }

        // 4. VERSO (Texto Cavado)
        // Começa na face inferior (Z=-2) e entra 1.2mm. 
        // Sobram 0.3mm de margem de segurança até à cavidade do chip.
        // 4. VERSO (Texto Cavado) corrigido
        // Invertemos o sinal de posTextoVersoH porque o mirror inverte o sentido do eixo X
        translate([-(posTextoVersoH * fator_pos), posTextoVersoV * fator_pos, -2.1])
            mirror([1,0,0]) 
            linear_extrude(height = 1.2)
                if (temNFC) {
                    text("NFC", size=4, halign="center", valign="center", font="Liberation Sans:style=Bold");
                } else {
                    text(telefone, size=(tamFonteVerso/10), halign="center", valign="center", font="Liberation Sans:style=Bold");
                }
    }

    // 5. FRENTE (Nome em Relevo)
    // Adicionado sobre a face superior (Z=2)
    color("white")
    translate([posTextoFrenteH * fator_pos, posTextoFrenteV * fator_pos, 2])
        linear_extrude(height = 1.2)
            text(nome, size=(tamFonte/4), halign="center", valign="center", font="Liberation Sans:style=Bold");
