let instanciaGrafico = null;

// --- FUNÇÕES DE INTERAÇÃO ---

// Função Wrapper para adicionar o delay de "processamento"
function iniciarCalculoComAnimacao() {
    const btn = document.getElementById('btnCalcular');
    const btnText = btn.querySelector('.btn-text');
    
    // Estado de Loading
    btn.classList.add('loading');
    btnText.innerText = "Processando Análise...";

    // Simula tempo de processamento (600ms) para efeito visual
    setTimeout(() => {
        processarTodosCalculosContabeis();
        
        // Restaura botão
        btn.classList.remove('loading');
        btnText.innerText = "Atualizar Dashboard";
    }, 600);
}

// --- FUNÇÕES DE AUTO-PREENCHIMENTO ---
function preencherAutomaticamenteDadosOperacionais() {
    const precoVenda = obterValorCampo('precoVendaUnitario');
    const custoVariavel = obterValorCampo('custoVariavelUnitario');
    const quantidade = obterValorCampo('quantidadeVendida');

    if (precoVenda === null || custoVariavel === null || quantidade === null) {
        alert("Por favor, preencha o Preço de Venda, Custo Variável e Quantidade na seção 'Dados Operacionais' primeiro.");
        return;
    }

    const receitaTotalCalculada = precoVenda * quantidade;
    const custoMercadoriasVendidasCalculado = custoVariavel * quantidade; 

    definirValorCampo('receitaTotalAnual', receitaTotalCalculada);
    definirValorCampo('custoMercadoriasVendidas', custoMercadoriasVendidasCalculado);
}

function estimarDadosFinanceiros() {
    const estoque = obterValorCampo('estoqueMedio') || 0;
    const contasReceber = obterValorCampo('contasReceberMedio') || 0;
    const fornecedores = obterValorCampo('fornecedoresMedio') || 0;
    
    const precoVenda = obterValorCampo('precoVendaUnitario');
    const custoVariavel = obterValorCampo('custoVariavelUnitario');
    const custoFixo = obterValorCampo('custosFixosTotais');
    const quantidade = obterValorCampo('quantidadeVendida');
    
    let lucroLiquidoEstimado = 0;
    
    if (precoVenda !== null && custoVariavel !== null && custoFixo !== null && quantidade !== null) {
        const margemContribuicaoUnitario = precoVenda - custoVariavel;
        const lucroOperacional = (quantidade * margemContribuicaoUnitario) - custoFixo;
        lucroLiquidoEstimado = lucroOperacional;
    }

    const ativoCirculanteEstimado = estoque + contasReceber;
    const passivoCirculanteEstimado = fornecedores;
    const ativoTotalEstimado = ativoCirculanteEstimado;

    if(!obterValorCampo('ativoCirculante')) definirValorCampo('ativoCirculante', ativoCirculanteEstimado);
    if(!obterValorCampo('passivoCirculante')) definirValorCampo('passivoCirculante', passivoCirculanteEstimado);
    if(!obterValorCampo('ativoTotal')) definirValorCampo('ativoTotal', ativoTotalEstimado);
    if(!obterValorCampo('lucroLiquido')) definirValorCampo('lucroLiquido', lucroLiquidoEstimado);
    
    if(!obterValorCampo('patrimonioLiquido')) {
            const patrimonioLiquidoEstimado = ativoTotalEstimado - passivoCirculanteEstimado;
            definirValorCampo('patrimonioLiquido', patrimonioLiquidoEstimado > 0 ? patrimonioLiquidoEstimado : 0);
    }
    
    alert("Valores estimados! Ajuste conforme necessário para maior precisão.");
}

// --- FUNÇÕES AUXILIARES ---
function formatarMoedaAoDigitar(elementoInput) {
    let valorTexto = elementoInput.value.replace(/\D/g, "");
    if (valorTexto === "") return;
    
    const valorFormatado = (parseFloat(valorTexto) / 100).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
    elementoInput.value = valorFormatado;
}

function definirValorCampo(idElemento, valorNumerico) {
    const elementoInput = document.getElementById(idElemento);
    elementoInput.value = valorNumerico.toFixed(2).replace('.', ',');
    formatarMoedaAoDigitar(elementoInput);
    
    // Pequeno flash visual para indicar mudança
    elementoInput.style.transition = 'none';
    elementoInput.style.backgroundColor = '#ecfdf5';
    setTimeout(() => {
        elementoInput.style.transition = 'all 0.5s';
        elementoInput.style.backgroundColor = '#ffffff';
    }, 300);
}

function obterValorCampo(idElemento) {
    let valorTexto = document.getElementById(idElemento).value;
    if (valorTexto === '' || valorTexto === null) return null;
    if (typeof valorTexto === 'string' && (valorTexto.includes('R$') || valorTexto.includes(',') || valorTexto.includes('.'))) {
        valorTexto = valorTexto.replace(/[^\d,]/g, '').replace(',', '.');
    }
    const valorNumerico = parseFloat(valorTexto);
    return isNaN(valorNumerico) ? null : valorNumerico;
}

function formatarValorMonetario(valorNumerico) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorNumerico);
}

// --- LÓGICA PRINCIPAL ---

function processarTodosCalculosContabeis() {
    const secaoResultados = document.getElementById('secaoResultados');
    
    // Resetar animações antes de calcular
    const cards = secaoResultados.querySelectorAll('.card');
    cards.forEach(card => {
        card.classList.remove('card-resultado-visivel');
        card.classList.add('card-resultado-oculto');
        const itens = card.querySelectorAll('.item-resultado');
        itens.forEach(item => item.classList.remove('item-resultado-animado'));
    });

    // Realizar Cálculos
    processarIndicadoresOperacionais();
    processarCiclosFinanceiros();
    processarIndicadoresFinanceiros();

    // Iniciar Animação
    secaoResultados.classList.add('mostrar');
    
    setTimeout(() => {
        animarResultadosEmCascata();
    }, 50);
}

function animarResultadosEmCascata() {
    const cards = document.querySelectorAll('#secaoResultados > .card');
    let delayGlobal = 0;

    cards.forEach((card, index) => {
        setTimeout(() => {
            card.classList.remove('card-resultado-oculto');
            card.classList.add('card-resultado-visivel');
            
            if(index === 0) {
                card.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }

            const itensTexto = card.querySelectorAll('.item-resultado');
            itensTexto.forEach((item, i) => {
                setTimeout(() => {
                    item.classList.add('item-resultado-animado');
                }, i * 80); // Delay mais rápido entre linhas
            });

            const grafico = card.querySelector('.container-grafico');
            if(grafico) {
                setTimeout(() => {
                    grafico.classList.add('visivel');
                }, 300);
            }

        }, delayGlobal);

        delayGlobal += 250; // Delay mais rápido entre cards
    });
}

function processarIndicadoresOperacionais() {
    const precoVenda = obterValorCampo('precoVendaUnitario');
    const custoVariavel = obterValorCampo('custoVariavelUnitario');
    const custosFixos = obterValorCampo('custosFixosTotais');
    const quantidade = obterValorCampo('quantidadeVendida');

    const elementoErro = document.getElementById('caixaErroOperacional');
    const elementoConteudo = document.getElementById('conteudoOperacional');
    const elementoContainerGrafico = document.getElementById('containerGrafico');

    let camposFaltantes = [];
    if (precoVenda === null) camposFaltantes.push("Preço de Venda");
    if (custoVariavel === null) camposFaltantes.push("Custo Variável");
    if (custosFixos === null) camposFaltantes.push("Custos Fixos");

    elementoErro.style.display = 'none';
    elementoConteudo.style.opacity = '1';
    elementoContainerGrafico.style.display = 'block';

    if (camposFaltantes.length > 0) {
        elementoErro.style.display = 'block';
        elementoErro.innerHTML = `<strong>Atenção:</strong> Faltam dados para este cálculo (${camposFaltantes.join(', ')}).`;
        elementoConteudo.style.opacity = '0.3';
        elementoContainerGrafico.style.display = 'none';
        return; 
    }

    const margemContribuicaoUnitario = precoVenda - custoVariavel;
    const margemContribuicaoPercentual = (margemContribuicaoUnitario / precoVenda) * 100;
    const pontoEquilibrioQuantidade = custosFixos / margemContribuicaoUnitario;
    const pontoEquilibrioValor = pontoEquilibrioQuantidade * precoVenda;

    document.getElementById('resultadoMargemContribuicaoUnitario').innerText = formatarValorMonetario(margemContribuicaoUnitario);
    document.getElementById('resultadoMargemContribuicaoPercentual').innerText = margemContribuicaoPercentual.toFixed(1) + '%';
    document.getElementById('resultadoPontoEquilibrioQuantidade').innerText = Math.ceil(pontoEquilibrioQuantidade) + ' un';
    document.getElementById('resultadoPontoEquilibrioValor').innerText = formatarValorMonetario(pontoEquilibrioValor);

    if (quantidade !== null) {
        const lucroOperacional = (quantidade * margemContribuicaoUnitario) - custosFixos;
        const margemContribuicaoTotal = quantidade * margemContribuicaoUnitario;
        let grauAlavancagemOperacional = lucroOperacional !== 0 ? (margemContribuicaoTotal / lucroOperacional) : 0;

        document.getElementById('resultadoGrauAlavancagemOperacional').innerText = grauAlavancagemOperacional.toFixed(2) + 'x';
        
        const elementoLucro = document.getElementById('resultadoLucroOperacional');
        elementoLucro.innerText = formatarValorMonetario(lucroOperacional);
        elementoLucro.className = lucroOperacional >= 0 ? 'valor-resultado destaque' : 'valor-resultado aviso';
        
        renderizarGraficoPontoEquilibrio(precoVenda, custoVariavel, custosFixos, quantidade, pontoEquilibrioQuantidade);
    } else {
        document.getElementById('resultadoGrauAlavancagemOperacional').innerText = "-";
        document.getElementById('resultadoLucroOperacional').innerText = "-";
        renderizarGraficoPontoEquilibrio(precoVenda, custoVariavel, custosFixos, pontoEquilibrioQuantidade * 1.2, pontoEquilibrioQuantidade);
    }
}

function processarCiclosFinanceiros() {
    const estoque = obterValorCampo('estoqueMedio');
    const contasReceber = obterValorCampo('contasReceberMedio');
    const fornecedores = obterValorCampo('fornecedoresMedio');
    const custoMercadorias = obterValorCampo('custoMercadoriasVendidas');
    const receitaTotal = obterValorCampo('receitaTotalAnual');
    const diasNoAno = 365;

    const elementoErro = document.getElementById('caixaErroCiclos');
    const elementoConteudo = document.getElementById('conteudoCiclos');
    
    if (custoMercadorias === null || receitaTotal === null) {
        elementoErro.style.display = 'block';
        elementoErro.innerHTML = `Necessário informar CMV e Receita Total para calcular os prazos médios.`;
        elementoConteudo.style.opacity = '0.3';
        return;
    } else {
        elementoErro.style.display = 'none';
        elementoConteudo.style.opacity = '1';
    }

    let prazoMedioEstocagem = 0;
    let prazoMedioRecebimento = 0;
    let prazoMedioPagamento = 0;
    let possuiPME = false;
    let possuiPMR = false;
    let possuiPMP = false;

    if (estoque !== null && custoMercadorias !== 0) {
        prazoMedioEstocagem = (estoque / custoMercadorias) * diasNoAno;
        document.getElementById('resultadoPrazoMedioEstocagem').innerText = Math.round(prazoMedioEstocagem) + ' dias';
        possuiPME = true;
    }

    if (contasReceber !== null && receitaTotal !== 0) {
        prazoMedioRecebimento = (contasReceber / receitaTotal) * diasNoAno;
        document.getElementById('resultadoPrazoMedioRecebimento').innerText = Math.round(prazoMedioRecebimento) + ' dias';
        possuiPMR = true;
    }

    if (fornecedores !== null && custoMercadorias !== 0) {
        prazoMedioPagamento = (fornecedores / custoMercadorias) * diasNoAno;
        document.getElementById('resultadoPrazoMedioPagamento').innerText = Math.round(prazoMedioPagamento) + ' dias';
        possuiPMP = true;
    }

    if (possuiPME && possuiPMR) {
        const cicloOperacional = prazoMedioEstocagem + prazoMedioRecebimento;
        document.getElementById('resultadoCicloOperacional').innerText = Math.round(cicloOperacional) + ' dias';
    } else {
        document.getElementById('resultadoCicloOperacional').innerText = "-";
    }

    if (possuiPME && possuiPMR && possuiPMP) {
        const cicloConversaoCaixa = (prazoMedioEstocagem + prazoMedioRecebimento) - prazoMedioPagamento;
        const elementoCCC = document.getElementById('resultadoCicloConversaoCaixa');
        elementoCCC.innerText = Math.round(cicloConversaoCaixa) + ' dias';
        elementoCCC.className = cicloConversaoCaixa <= 0 ? 'valor-resultado destaque' : 'valor-resultado aviso';
    }
}

function processarIndicadoresFinanceiros() {
    const ativoCirculante = obterValorCampo('ativoCirculante');
    const passivoCirculante = obterValorCampo('passivoCirculante');
    const estoque = obterValorCampo('estoqueMedio') || 0;
    const lucroLiquido = obterValorCampo('lucroLiquido');
    const receitaTotal = obterValorCampo('receitaTotalAnual');
    const patrimonioLiquido = obterValorCampo('patrimonioLiquido');
    const ativoTotal = obterValorCampo('ativoTotal');

    const elementoErro = document.getElementById('caixaErroFinanceiro');
    const elementoConteudo = document.getElementById('conteudoFinanceiro');

    if (ativoCirculante === null || passivoCirculante === null) {
            elementoErro.style.display = 'block';
            elementoErro.innerHTML = "Preencha Ativo Circulante e Passivo Circulante para calcular liquidez.";
            elementoConteudo.style.opacity = '0.3';
            return;
    }

    elementoErro.style.display = 'none';
    elementoConteudo.style.opacity = '1';

    if(passivoCirculante !== 0) {
        const liquidezCorrente = ativoCirculante / passivoCirculante;
        const liquidezSeca = (ativoCirculante - estoque) / passivoCirculante;
        
        const elementoLiqCorrente = document.getElementById('resultadoLiquidezCorrente');
        elementoLiqCorrente.innerText = liquidezCorrente.toFixed(2);
        elementoLiqCorrente.className = liquidezCorrente >= 1 ? 'valor-resultado destaque' : 'valor-resultado aviso';

        document.getElementById('resultadoLiquidezSeca').innerText = liquidezSeca.toFixed(2);
    }

    if(lucroLiquido !== null && receitaTotal !== null && receitaTotal !== 0) {
        const margemLiquida = (lucroLiquido / receitaTotal) * 100;
        const elementoMargemLiq = document.getElementById('resultadoMargemLiquida');
        elementoMargemLiq.innerText = margemLiquida.toFixed(1) + '%';
        elementoMargemLiq.className = margemLiquida > 0 ? 'valor-resultado' : 'valor-resultado aviso';
    }

    if(lucroLiquido !== null && patrimonioLiquido !== null && patrimonioLiquido !== 0) {
        const retornoSobrePatrimonio = (lucroLiquido / patrimonioLiquido) * 100;
        document.getElementById('resultadoRetornoSobrePatrimonio').innerText = retornoSobrePatrimonio.toFixed(1) + '%';
    } else {
            document.getElementById('resultadoRetornoSobrePatrimonio').innerText = "-";
    }

    if(lucroLiquido !== null && ativoTotal !== null && ativoTotal !== 0) {
        const retornoSobreAtivo = (lucroLiquido / ativoTotal) * 100;
        document.getElementById('resultadoRetornoSobreAtivo').innerText = retornoSobreAtivo.toFixed(1) + '%';
    } else {
            document.getElementById('resultadoRetornoSobreAtivo').innerText = "-";
    }
}

function renderizarGraficoPontoEquilibrio(precoVenda, custoVariavel, custosFixos, quantidadeLimite, quantidadePontoEquilibrio) {
    const contextoCanvas = document.getElementById('graficoPontoEquilibrio').getContext('2d');
    
    const quantidadeMaximaGrafico = Math.max(quantidadeLimite, quantidadePontoEquilibrio) * 1.5;
    const passoGrafico = quantidadeMaximaGrafico / 15; 
    
    let rotulosEixoX = [];
    let dadosCustosTotais = [];
    let dadosReceitaTotal = [];

    for(let i = 0; i <= quantidadeMaximaGrafico; i += passoGrafico) {
        let quantidadeAtual = Math.round(i);
        rotulosEixoX.push(quantidadeAtual);
        dadosReceitaTotal.push(quantidadeAtual * precoVenda);
        dadosCustosTotais.push(custosFixos + (quantidadeAtual * custoVariavel));
    }

    if(instanciaGrafico) instanciaGrafico.destroy();

    // Degradê para o gráfico
    const gradienteReceita = contextoCanvas.createLinearGradient(0, 0, 0, 400);
    gradienteReceita.addColorStop(0, 'rgba(16, 185, 129, 0.2)');
    gradienteReceita.addColorStop(1, 'rgba(16, 185, 129, 0.0)');

    const gradienteCusto = contextoCanvas.createLinearGradient(0, 0, 0, 400);
    gradienteCusto.addColorStop(0, 'rgba(239, 68, 68, 0.2)');
    gradienteCusto.addColorStop(1, 'rgba(239, 68, 68, 0.0)');

    instanciaGrafico = new Chart(contextoCanvas, {
        type: 'line',
        data: {
            labels: rotulosEixoX,
            datasets: [
                {
                    label: 'Receita Total',
                    data: dadosReceitaTotal,
                    borderColor: '#10b981',
                    backgroundColor: gradienteReceita,
                    borderWidth: 3,
                    fill: true,
                    tension: 0.3, // Curva suave
                    pointRadius: 0,
                    pointHoverRadius: 6
                },
                {
                    label: 'Custos Totais',
                    data: dadosCustosTotais,
                    borderColor: '#ef4444',
                    backgroundColor: gradienteCusto,
                    borderWidth: 3,
                    fill: true,
                    tension: 0.3,
                    pointRadius: 0,
                    pointHoverRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                tooltip: {
                    backgroundColor: 'rgba(30, 41, 59, 0.9)',
                    titleFont: { family: 'Inter', size: 13 },
                    bodyFont: { family: 'Inter', size: 12 },
                    padding: 12,
                    cornerRadius: 8,
                    callbacks: {
                        label: function(contexto) {
                            let rotulo = contexto.dataset.label || '';
                            if (rotulo) rotulo += ': ';
                            if (contexto.parsed.y !== null) {
                                rotulo += new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(contexto.parsed.y);
                            }
                            return rotulo;
                        }
                    }
                },
                legend: {
                    labels: {
                        font: { family: 'Inter', size: 12 },
                        color: '#64748b'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: '#f1f5f9'
                    },
                    ticks: {
                        font: { family: 'Inter' },
                        color: '#64748b',
                        callback: function(valor) { return 'R$ ' + (valor/1000).toFixed(0) + 'k'; }
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: { family: 'Inter' },
                        color: '#64748b'
                    }
                }
            }
        }
    });
}