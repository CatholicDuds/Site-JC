# RBN Automação Industrial — site full-stack

## O que foi adicionado
- Logo oficial enviada pelo usuário em `public/assets/logo.jpg`.
- Seção de setores com filtros clicáveis.
- Estrutura de projetos/empresas consumida por `GET /api/projects`.
- Mapa incorporado do Google Maps usando o endereço presente no site original.
- Botões para WhatsApp.
- Seletor PT / EN / ES com persistência no navegador.
- Formulário de contato conectado a `POST /api/contact`.
- Backend Express + Nodemailer + Helmet + rate limit.
- `.env.example` para configuração SMTP.
- O backend não inventa nomes de clientes: os arquivos enviados listam os setores, mas não os nomes das empresas atendidas.

## Instalação
1. Instale Node.js 18+.
2. Abra o terminal nesta pasta.
3. Rode `npm install`.
4. Copie `.env.example` para `.env`.
5. Preencha as credenciais SMTP e `CONTACT_TO`.
6. Rode `npm start`.
7. Acesse `http://localhost:3000`.

## Cadastro dos projetos
Edite o array `projects` no `server.js` com os dados reais:
```js
{ 
  sector: "Cimento",
  company: "Empresa real",
  description: "Descrição do serviço realizado",
  scope: "CLP, supervisão, redes..."
}
```

## WhatsApp
O link atual usa o telefone exibido no site como destino inicial: `55 41 99593-9124`.
Confirme com a RBN se esse número também é WhatsApp antes da publicação.

## Produção
Para publicar, use um servidor Node/host que suporte variáveis de ambiente. Nunca coloque senha SMTP diretamente no HTML/JavaScript.


## Configuração solicitada
- WhatsApp: +55 41 99593-9124
- Destinatário dos contatos: j.c.perussolo17@gmail.com
- Para envio SMTP real, ainda é necessário preencher SMTP_HOST, SMTP_PORT, SMTP_USER e SMTP_PASS no `.env`.
