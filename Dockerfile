# Usa uma imagem leve de Node.js
FROM node:18-slim


# Instala o OpenSCAD e dependências gráficas mínimas para exportação headless
RUN apt-get update && apt-get install -y \
    openscad \
    xvfb \
    dbus-x11 \
    libxrender1 \
    libxext6 \
    libxinerama1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY nfc-icon.svg ./nfc-icon.svg

# Copia os ficheiros do projeto
COPY package*.json ./
RUN npm install
COPY . .

# Expõe a porta da API
EXPOSE 3000

# Comando para rodar com Xvfb (necessário para o OpenSCAD rodar em servidores sem monitor)
CMD ["node", "server.js"]