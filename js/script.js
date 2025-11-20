let myChart = null;

// ---------------------------------------------------------
// NOVA LÓGICA DE AUTO-PREENCHIMENTO
// ---------------------------------------------------------
function autoFillFromOp() {
    // 1. Pegar valores unitários
    const price = getVal('price');
    const vc = getVal('vc');
    const quantity = getVal('quantity');

    if (price === null || vc === null || quantity === null) {
        alert("Preencha Preço, Custo Variável e Quantidade na Seção 1 primeiro.");
        return;
    }

    // 2. Calcular totais
    const totalRevenue = price * quantity;
    const totalCogs = vc * quantity; // Estimativa: CMV ~= Custo Variável Total

    // 3. Atualizar inputs visualmente com formatação
    const revInput = document.getElementById('revenue');
    revInput.value = (totalRevenue).toFixed(2).replace('.', ','); // Formato temporário
    formatMoney(revInput); // Aplica a máscara visual R$

    const cogsInput = document.getElementById('cogs');
    cogsInput.value = (totalCogs).toFixed(2).replace('.', ',');
    formatMoney(cogsInput);
}


// ---------------------------------------------------------
// LÓGICA DE MÁSCARA E TRATAMENTO DE VALORES
// ---------------------------------------------------------

// Aplica máscara de R$ enquanto digita
function formatMoney(input) {
    // Remove tudo que não é dígito
    let value = input.value.replace(/\D/g, "");
    
    if (value === "") {
        // Se vazio, limpa
        return;
    }

    // Converte para centavos e formata (Ex: 1500 -> 15.00)
    // Usando toLocaleString para garantir o padrão BRL
    const formatted = (parseFloat(value) / 100).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });

    input.value = formatted;
}

// Utilitário atualizado para pegar valor limpo
function getVal(id) {
    let val = document.getElementById(id).value;
    if (val === '' || val === null) return null;

    // Se for um campo de quantidade (type="number"), vem direto
    // Se for texto (moeda), precisamos limpar a formatação
    if (typeof val === 'string' && (val.includes('R$') || val.includes(',') || val.includes('.'))) {
        // 1. Remove R$, espaços e pontos de milhar: "R$ 1.500,50" -> "1500,50"
        // 2. Substitui a vírgula decimal por ponto: "1500,50" -> "1500.50"
        val = val.replace(/[^\d,]/g, '').replace(',', '.');
    }

    const parsed = parseFloat(val);
    return isNaN(parsed) ? null : parsed;
}

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

// ---------------------------------------------------------
// LÓGICA ORIGINAL DE CÁLCULO (Mantida)
// ---------------------------------------------------------

// Função Principal
function processCalculations() {
    // Mostrar a seção de resultados
    const resultSection = document.getElementById('resultsSection');
    resultSection.classList.add('show');
    resultSection.style.display = 'grid';

    // 1. Processar Bloco Operacional (Ponto de Equilíbrio, Lucro, etc)
    processOperational();

    // 2. Processar Bloco de Ciclos
    processCycles();
}

function processOperational() {
    const price = getVal('price');
    const vc = getVal('vc');
    const fc = getVal('fc');
    const quantity = getVal('quantity');

    const errorBox = document.getElementById('error-operational');
    const contentBox = document.getElementById('content-operational');
    const chartErrorBox = document.getElementById('error-chart');
    const chartWrapper = document.getElementById('chart-wrapper');

    // Verificar campos faltantes essenciais para Ponto de Equilibrio
    let missing = [];
    if (price === null) missing.push("Preço de Venda");
    if (vc === null) missing.push("Custo Variável");
    if (fc === null) missing.push("Custos Fixos");

    // Reseta visualização
    errorBox.style.display = 'none';
    errorBox.innerHTML = '';
    contentBox.style.opacity = '1';
    chartErrorBox.style.display = 'none';
    chartWrapper.style.display = 'block';

    if (missing.length > 0) {
        // Se faltam dados essenciais para o básico
        errorBox.style.display = 'block';
        errorBox.innerHTML = `<strong>Não foi possível calcular resultados operacionais.</strong><br>Faltam: <ul>${missing.map(m => `<li>${m}</li>`).join('')}</ul>`;
        contentBox.style.opacity = '0.3'; // "Desabilita" visualmente
        
        // Também desabilita o gráfico
        chartErrorBox.style.display = 'block';
        chartErrorBox.innerText = "Gráfico indisponível devido à falta de dados operacionais.";
        chartWrapper.style.display = 'none';
        return; 
    }

    // Cálculos Possíveis com Preço, CV e CF
    const mcu = price - vc;
    const mcPercent = (mcu / price) * 100;
    const peQtd = fc / mcu;
    const peVal = peQtd * price;

    document.getElementById('res-mcu').innerText = formatCurrency(mcu);
    document.getElementById('res-mc-percent').innerText = mcPercent.toFixed(2) + '%';
    document.getElementById('res-pe-qtd').innerText = Math.ceil(peQtd) + ' un';
    document.getElementById('res-pe-val').innerText = formatCurrency(peVal);

    // Cálculos que dependem da Quantidade
    if (quantity !== null) {
        const ebit = (quantity * mcu) - fc;
        const totalMC = quantity * mcu;
        let gao = ebit !== 0 ? (totalMC / ebit) : 0;

        document.getElementById('res-gao').innerText = gao.toFixed(2) + 'x';
        
        const profitEl = document.getElementById('res-profit');
        profitEl.innerText = formatCurrency(ebit);
        profitEl.className = ebit >= 0 ? 'result-value highlight' : 'result-value warning';
        
        // Renderizar gráfico com quantidade atual
        renderChart(price, vc, fc, quantity, peQtd);
    } else {
        document.getElementById('res-gao').innerText = "Necessita Qtd";
        document.getElementById('res-profit').innerText = "Necessita Qtd";
        
        // Renderizar gráfico sem linha de 'situação atual', apenas Break Even
        renderChart(price, vc, fc, peQtd * 1.2, peQtd);
    }
}

function processCycles() {
    const inventory = getVal('inventory');
    const receivables = getVal('receivables');
    const payables = getVal('payables');
    const cogs = getVal('cogs');
    const revenue = getVal('revenue');
    const days = 365;

    const errorBox = document.getElementById('error-cycles');
    const contentBox = document.getElementById('content-cycles');
    
    let missing = [];
    // Precisamos de Receita e CMV como base para qualquer ciclo
    if (cogs === null) missing.push("CMV");
    if (revenue === null) missing.push("Receita");

    errorBox.style.display = 'none';
    contentBox.style.opacity = '1';

    if (missing.length > 0) {
        errorBox.style.display = 'block';
        errorBox.innerHTML = `<strong>Dados base insuficientes.</strong><br>Faltam: ${missing.join(', ')}`;
        contentBox.style.opacity = '0.3';
        return;
    }

    // Cálculo Individual (Permissivo)
    // Se faltar estoque, PME = 0 ou traço, mas calcula os outros
    
    let pme = 0, pmr = 0, pmp = 0;
    let hasPME = false, hasPMR = false, hasPMP = false;

    // PME
    if (inventory !== null && cogs !== 0) {
        pme = (inventory / cogs) * days;
        document.getElementById('res-pme').innerText = Math.round(pme) + ' dias';
        hasPME = true;
    } else {
        document.getElementById('res-pme').innerText = "-";
    }

    // PMR
    if (receivables !== null && revenue !== 0) {
        pmr = (receivables / revenue) * days;
        document.getElementById('res-pmr').innerText = Math.round(pmr) + ' dias';
        hasPMR = true;
    } else {
        document.getElementById('res-pmr').innerText = "-";
    }

    // PMP
    if (payables !== null && cogs !== 0) {
        pmp = (payables / cogs) * days;
        document.getElementById('res-pmp').innerText = Math.round(pmp) + ' dias';
        hasPMP = true;
    } else {
        document.getElementById('res-pmp').innerText = "-";
    }

    // Ciclos Compostos
    if (hasPME && hasPMR) {
        document.getElementById('res-co').innerText = Math.round(pme + pmr) + ' dias';
    } else {
        document.getElementById('res-co').innerText = "Faltam dados";
    }

    if (hasPME && hasPMR && hasPMP) {
        const ccc = (pme + pmr) - pmp;
        const cccEl = document.getElementById('res-ccc');
        cccEl.innerText = Math.round(ccc) + ' dias';
        cccEl.className = ccc <= 0 ? 'result-value highlight' : 'result-value warning';
    } else {
        document.getElementById('res-ccc').innerText = "Faltam dados";
    }
}

function renderChart(price, vc, fc, limitQtd, breakEvenQtd) {
    const ctx = document.getElementById('beChart').getContext('2d');
    
    // Definir range do gráfico
    const maxQtd = Math.max(limitQtd, breakEvenQtd) * 1.5;
    const step = maxQtd / 15; // mais pontos para suavidade
    
    let labels = [];
    let totalCostsData = [];
    let revenueData = [];

    for(let i = 0; i <= maxQtd; i += step) {
        let q = Math.round(i);
        labels.push(q);
        revenueData.push(q * price);
        totalCostsData.push(fc + (q * vc));
    }

    if(myChart) {
        myChart.destroy();
    }

    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Receita Total',
                    data: revenueData,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.1
                },
                {
                    label: 'Custos Totais',
                    data: totalCostsData,
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) label += ': ';
                            if (context.parsed.y !== null) {
                                label += new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(context.parsed.y);
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return 'R$ ' + value / 1000 + 'k';
                        }
                    }
                }
            }
        }
    });
}