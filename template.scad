// ==========================================
// PARÂMETROS DINÂMICOS DA API
// ==========================================
nome = "BOBI";           
largura = 50;           
altura = 35;            
profundidade = 4;       
temNFC = true;          

// Parâmetros do Nome (Frente)
tamanhoFonte = 8;       // Injetado: tamanho do texto
nomePosX = 0;           // Injetado: posição horizontal nome
nomePosY = 8;           // Injetado: posição vertical nome

// Parâmetros do Ícone NFC (Frente/Verso)
nfcPosX = 0;            // Injetado: posição horizontal ícone
nfcPosY = -8;           // Injetado: posição vertical ícone

$fn = 60;               

// Validação de segurança para o chip
pode_ter_nfc = (largura >= 28 && altura >= 28);

module osso(w, h, d) {
    union() {
        cube([w*0.6, h*0.8, d], center=true);
        translate([w*0.3, h*0.3, 0]) cylinder(h=d, d=h*0.6, center=true);
        translate([w*0.3, -h*0.3, 0]) cylinder(h=d, d=h*0.6, center=true);
        translate([-w*0.3, h*0.3, 0]) cylinder(h=d, d=h*0.6, center=true);
        translate([-w*0.3, -h*0.3, 0]) cylinder(h=d, d=h*0.6, center=true);
    }
}

difference() {
    // 1. FORMA BASE
    osso(largura, altura, profundidade);
    
    // 2. GRAVAÇÃO DO NOME (FRENTE)
    // Usa as coordenadas e o tamanho vindos da API
    translate([nomePosX, nomePosY, profundidade/2 - 0.8]) 
        linear_extrude(height = 1)
            text(nome, size = tamanhoFonte, halign="center", valign="center", font="Liberation Sans:style=Bold");

    // 3. LÓGICA NFC
    if (temNFC && pode_ter_nfc) {
        // A. CAVIDADE PARA O CHIP (CENTRO DO VERSO)
        translate([0, 0, -profundidade/2 - 0.1]) 
            cylinder(d=25.5, h=2.1, center=false);
            
        // B. ÍCONE NFC (Símbolo cavado usando posições da API)
        translate([nfcPosX, nfcPosY, profundidade/2 - 0.5])
            linear_extrude(height = 1)
                resize([12, 0], auto=true) 
                    import("nfc-icon.svg", center=true);
    }

    // 4. FURO PARA A ARGOLA
    translate([-largura*0.35, 0, -profundidade])
        cylinder(h=profundidade*2, d=3.5);
}