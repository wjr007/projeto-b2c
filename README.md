# Projeto B2C - Mostrador de Produto 3D 360° Interativo com Personalização

Aplicação web e-commerce de alto padrão para apresentação de produtos em 3D interativo, inspirada na experiência de compra da **Gocase**. Desenvolvida com **Three.js**, permite que os clientes inspecionem um copo térmico de 473ml em 360 graus, escolham variações de cores e personalizem o produto em tempo real com gravação a laser do seu nome.

---

## 🌟 Principais Recursos

1. **Visualizador 3D 360° Interativo**:
   - Controle total de rotação por clique e arraste, sem rotações automáticas invasivas.
   - Zoom suave pela roda do mouse (scroll) e reposicionamento com amortecimento inercial (*OrbitControls damping*).
   - Botões de perspectiva canônica: **0° Frente**, **90° Lateral**, **180° Gravação** e **270° Lateral**.
   - Modelagem física com parede dupla isolada a vácuo, cavidade interna em aço inoxidável e bordas escovadas.
   - Iluminação fotográfica de estúdio de 3 pontos com sombra de contato suave.

2. **Seletor de Variações de Cores (Barra Lateral Esquerda)**:
   - **Verde Cargill (Edição Oficial)**: Textura vetorial 4K sem emendas com logotipo institucional e fitas orgânicas.
   - **Preto Fosco (*Matte Black*)**: Acabamento em pó micropulverizado acetinado.
   - **Branco Neve (*Gloss White*)**: Esmalte brilhante de alta refletividade.
   - **Azul Marinho (*Navy Blue*)**: Tom escuro elegante e acetinado.
   - **Terracota (*Terracotta*)**: Esmalte fosco em tom coral acolhedor.
   - **Aço Inox Puro (*Pure Brushed Steel*)**: Metal puro com ranhuras anisotrópicas horizontais escovadas.

3. **Card "Grave seu nome" (Personalização em Tempo Real)**:
   - Interface idêntica ao benchmark de personalização da Gocase.
   - Campo de digitação de nome que grava o texto imediatamente no modelo 3D em tempo real.
   - Seletor de 7 cores de gravação:
     - ⚪ Branco (`#ffffff`)
     - 🌲 Verde Petróleo (`#1f7a68`)
     - 🔵 Azul Céu (`#5b9cf6`)
     - 🌸 Rosa Chiclete (`#f78da7`)
     - 🟡 Amarelo (`#fce300`)
     - 🟤 Bronze Caramelo (`#a47858`)
     - 🍷 Bordô Vinho (`#7a0c23`)
   - Botão seletor (*checkbox*) para ativar/desativar a gravação instantaneamente.
   - Transição suave da câmera diretamente para a face gravada ao digitar.

4. **Experiência E-Commerce Completa**:
   - Cabeçalho institucional com benefícios (*badges*) de produto (Aço Inox 304, 12h frio / 6h quente, gravação grátis).
   - Botões de ação para compra ("Adicionar ao Carrinho" e "Comprar Agora").
   - Responsividade completa para dispositivos móveis, tablets e monitores widescreen.

---

## 📁 Estrutura de Arquivos

```
projeto-b2c/
├── index.html                   # Estrutura principal da vitrine de e-commerce e canvas 3D
├── css/
│   └── styles.css               # Design moderno, responsividade e layout da Gocase
├── js/
│   ├── app.js                   # Orquestrador da aplicação, eventos de UI e sincronização 3D
│   ├── cup-model.js             # Geometria 3D paramétrica do copo e materiais PBR
│   ├── texture-generator.js     # Gerador dinâmico de textura 4K e gravação de nome em canvas
│   └── studio-scene.js          # Cena Three.js, iluminação de estúdio fotográfico e sombras
├── assets/
│   └── references/              # Fotos reais de referência do produto
├── server.js                    # Servidor HTTP nativo em Node.js (zero dependências)
├── server.ps1                   # Servidor alternativo nativo em PowerShell
├── iniciar_servidor.bat         # Atalho de 1 clique para inicialização no Windows
├── package.json                 # Scripts e metadados do projeto
└── README.md                    # Documentação do projeto
```

---

## 🚀 Como Executar Localmente

### Opção 1: Via Node.js (Recomendado)
Na pasta do projeto, execute:

```bash
npm start
```
ou diretamente:
```bash
node server.js
```
Acesse no navegador: **`http://localhost:8080/`**

### Opção 2: Via Atalho no Windows
Dê um duplo clique no arquivo:
```
iniciar_servidor.bat
```

### Opção 3: Via PowerShell
```powershell
powershell -ExecutionPolicy Bypass -File .\server.ps1
```

---

## 🛠️ Tecnologias Utilizadas

- **Three.js (`v0.185.1`)**: Renderização WebGL acelerada por hardware, controle de materiais PBR (*MeshStandardMaterial*), *ACESFilmicToneMapping* e sombras suaves (*PCFShadowMap*).
- **OrbitControls**: Gestão de interação 360° com amortecimento inercial (*damping*).
- **Canvas API 2D**: Geração vetorial procedimental de texturas em resolução 4K (4096 × 2048) e renderização tipográfica da gravação a laser.
- **HTML5 & Vanilla CSS3**: Interface responsiva com tipografia moderna (*Plus Jakarta Sans*).
- **Node.js**: Servidor estático nativo HTTP sem dependências externas.
