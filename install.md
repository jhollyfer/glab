# 🚀 Vite React TypeScript - Deploy em EC2

Este guia apresenta o setup completo de um projeto Vite + React + TypeScript e seu deploy em uma instância EC2 da AWS.

## 📋 Pré-requisitos

### Local

- Node.js (versão 18+ recomendada)
- npm ou yarn
- Git

### AWS

- Conta AWS ativa
- Instância EC2 configurada (Ubuntu 20.04+ recomendado)
- Par de chaves SSH para acesso à instância
- Security Group configurado (portas 22, 80, 443, 3000)

---

## 🛠️ Setup Local do Projeto

### 1. Criação do Projeto

```bash
# Criar projeto Vite com React + TypeScript
npm create vite@latest meu-projeto-react -- --template react-ts

# Navegar para o diretório
cd meu-projeto-react

# Instalar dependências
npm install
```

### 2. Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview

# Linting
npm run lint
```

### 3. Estrutura do Projeto

```
meu-projeto-react/
├── public/
│   └── vite.svg
├── src/
│   ├── assets/
│   ├── components/
│   ├── App.tsx
│   ├── App.css
│   ├── index.css
│   └── main.tsx
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── eslint.config.js
```

### 4. Configurações Adicionais (Opcional)

#### Instalar dependências úteis:

```bash
# React Router
npm install react-router-dom
npm install -D @types/react-router-dom

# Styled Components
npm install styled-components
npm install -D @types/styled-components

# Axios para requisições HTTP
npm install axios
```

#### Configurar Vite para produção:

```typescript
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    sourcemap: false,
    minify: "terser",
  },
  server: {
    port: 3000,
    host: true, // Importante para acessar de IPs externos
  },
});
```

---

## ☁️ Configuração da Instância EC2

### 1. Criação da Instância

1. **AWS Console** → EC2 → Launch Instance
2. **AMI**: Ubuntu Server 22.04 LTS
3. **Instance Type**: t2.micro (Free Tier) ou t3.small
4. **Key Pair**: Criar ou usar existente
5. **Security Group**: Configurar portas

### 2. Configuração do Security Group

| Tipo   | Protocolo | Porta | Origem    | Descrição         |
| ------ | --------- | ----- | --------- | ----------------- |
| SSH    | TCP       | 22    | Seu IP    | Acesso SSH        |
| HTTP   | TCP       | 80    | 0.0.0.0/0 | Tráfego web HTTP  |
| HTTPS  | TCP       | 443   | 0.0.0.0/0 | Tráfego web HTTPS |
| Custom | TCP       | 3000  | 0.0.0.0/0 | App React (dev)   |

### 3. Acesso à Instância

```bash
# Conectar via SSH (substitua pelos seus valores)
ssh -i "sua-chave.pem" ubuntu@ec2-xx-xx-xx-xx.compute-1.amazonaws.com
```

---

## 🔧 Setup do Ambiente na EC2

### 1. Atualização do Sistema

```bash
# Atualizar pacotes
sudo apt update && sudo apt upgrade -y

# Instalar curl e wget
sudo apt install curl wget git -y
```

### 2. Instalação do Node.js

```bash
# Instalar Node.js via NodeSource
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar instalação
node --version
npm --version
```

### 3. Instalação do PM2 (Process Manager)

```bash
# Instalar PM2 globalmente
sudo npm install -g pm2

# Configurar PM2 para iniciar com o sistema
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu
```

### 4. Instalação do Nginx

```bash
# Instalar Nginx
sudo apt install nginx -y

# Habilitar e iniciar Nginx
sudo systemctl enable nginx
sudo systemctl start nginx

# Verificar status
sudo systemctl status nginx
```

---

## 📦 Deploy da Aplicação

### 1. Transferir Código para EC2

#### Opção A: Via Git (Recomendado)

```bash
# Na EC2
git clone https://github.com/seu-usuario/meu-projeto-react.git
cd meu-projeto-react
npm install
```

#### Opção B: Via SCP

```bash
# No seu computador local
scp -i "sua-chave.pem" -r ./meu-projeto-react ubuntu@ec2-xx-xx-xx-xx.compute-1.amazonaws.com:~/
```

### 2. Build da Aplicação

```bash
# Na EC2, dentro do diretório do projeto
npm run build
```

### 3. Configuração do Nginx

```bash
# Criar configuração do site
sudo nano /etc/nginx/sites-available/meu-projeto-react
```

Adicionar a configuração:

```nginx
server {
    listen 80;
    server_name seu-dominio.com www.seu-dominio.com;  # ou IP da instância

    root /home/ubuntu/meu-projeto-react/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Configurações para assets estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
# Habilitar o site
sudo ln -s /etc/nginx/sites-available/meu-projeto-react /etc/nginx/sites-enabled/

# Remover configuração padrão
sudo rm /etc/nginx/sites-enabled/default

# Testar configuração
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

### 4. Configuração para Aplicação SPA (Opcional)

Se usando React Router, adicione ao Nginx:

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

---

## 🚀 Deploy Automatizado com PM2

### 1. Executar Aplicação via PM2

```bash
# Navegar para o diretório do projeto
cd meu-projeto-react

# Executar com PM2 (modo preview)
pm2 start npm --name "react-app" -- run preview

# Ou servir diretamente os arquivos estáticos
pm2 serve dist 3000 --name "react-app" --spa
```

### 2. Configuração PM2 Ecosystem

Criar arquivo `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: "react-app",
      script: "serve",
      args: "-s dist -l 3000",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
```

```bash
# Instalar serve
npm install -g serve

# Iniciar com ecosystem
pm2 start ecosystem.config.js

# Salvar configuração PM2
pm2 save
```

---

## 🔒 Configuração HTTPS com Let's Encrypt

### 1. Instalar Certbot

```bash
sudo apt install certbot python3-certbot-nginx -y
```

### 2. Obter Certificado SSL

```bash
# Substitua pelo seu domínio
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com
```

### 3. Renovação Automática

```bash
# Testar renovação
sudo certbot renew --dry-run

# Configurar cron para renovação automática
sudo crontab -e

# Adicionar linha:
0 12 * * * /usr/bin/certbot renew --quiet
```

---

## 📊 Monitoramento e Logs

### Comandos PM2 Úteis

```bash
# Listar processos
pm2 list

# Ver logs
pm2 logs react-app

# Monitorar recursos
pm2 monit

# Reiniciar aplicação
pm2 restart react-app

# Parar aplicação
pm2 stop react-app
```

### Logs do Nginx

```bash
# Logs de acesso
sudo tail -f /var/log/nginx/access.log

# Logs de erro
sudo tail -f /var/log/nginx/error.log
```

---

## 🔄 Processo de Atualização

### Script de Deploy Automatizado

Criar `deploy.sh`:

```bash
#!/bin/bash

# Atualizar código
git pull origin main

# Instalar dependências
npm install

# Build da aplicação
npm run build

# Reiniciar PM2
pm2 restart react-app

# Recarregar Nginx
sudo systemctl reload nginx

echo "Deploy concluído!"
```

```bash
# Tornar executável
chmod +x deploy.sh

# Executar deploy
./deploy.sh
```

---

## ⚡ Otimizações de Performance

### 1. Configuração do Nginx para Performance

```nginx
# Adicionar ao bloco server
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

# Headers de segurança
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header X-Content-Type-Options "nosniff" always;
```

### 2. Configurações do Vite para Produção

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});
```

---

## 🐛 Troubleshooting

### Problemas Comuns

1. **Erro 502 Bad Gateway**

   - Verificar se PM2 está rodando: `pm2 list`
   - Verificar logs: `pm2 logs`

2. **Aplicação não carrega**

   - Verificar build: `ls -la dist/`
   - Verificar permissões: `sudo chown -R www-data:www-data dist/`

3. **Rotas não funcionam (404)**
   - Verificar configuração `try_files` no Nginx
   - Adicionar `--spa` ao PM2 serve

### Comandos de Diagnóstico

```bash
# Status dos serviços
sudo systemctl status nginx
sudo systemctl status pm2-ubuntu

# Verificar portas em uso
sudo netstat -tlnp

# Verificar logs do sistema
sudo journalctl -u nginx -f
```

---

## 📚 Recursos Adicionais

- [Documentação do Vite](https://vitejs.dev/)
- [Documentação do React](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [PM2 Documentation](https://pm2.keymetrics.io/)
- [Nginx Documentation](https://nginx.org/en/docs/)

---

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

