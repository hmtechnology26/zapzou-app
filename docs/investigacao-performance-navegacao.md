# Investigação de Performance, Navegação e Tela Branca

Este documento detalha a investigação sobre o problema de "tela branca" durante a navegação entre páginas e propõe melhorias de performance e fluidez para o ZapZou.

## 1. Diagnóstico do Problema: "Tela Branca"

O sintoma descrito (tela branca que só resolve com Ctrl+F5) é uma indicação clássica de falha na hidratação do React ou corrupção do cache do navegador/Service Worker.

### Causa A: Erros de Hidratação e Travamento do React
Ao analisar os logs de erro (`docs/erro.txt`), identificamos múltiplos erros de hidratação:
- `Hydration failed because the initial UI does not match what was rendered on the server.`
- `Uncaught NotFoundError: Failed to execute 'removeChild' on 'Node'`.

**Por que isso causa tela branca?**
Quando o React encontra um erro crítico de hidratação ou uma inconsistência na árvore DOM (como tentar remover um nó que não existe), ele pode "desistir" da renderização atual, resultando em uma tela em branco (ou mantendo apenas o estado inicial de carregamento). No Next.js App Router, isso pode paralisar a navegação client-side.

**Por que Ctrl+F5 resolve?**
O hard refresh força o navegador a baixar todo o HTML e JS do zero, limpando inconsistências de memória, mas se a causa raiz (mismatch entre server e client) persistir, o erro voltará na próxima navegação ou reload.

### Causa B: Service Workers Fantasmas (PWA)
Investigamos a configuração de PWA e notamos que **atualmente não há um Service Worker ou Manifest configurado no repositório**.

**O Problema**: Se em versões anteriores o ZapZou utilizou PWA ou se o domínio/IP já hospedou um PWA, o navegador do usuário pode ter um **Service Worker "zumbi"** instalado. 
- Esse SW pode estar servindo versões cacheadas e obsoletas do `index.html` que apontam para arquivos JS (chunks) que não existem mais no servidor atual.
- Ao navegar, o Next.js tenta carregar um chunk novo, o SW falha ou retorna 404, e o app quebra.
- Ctrl+F5 geralmente ignora o Service Worker e busca o recurso direto da rede, resolvendo momentaneamente.

## 2. Configurações de PWA

Atualmente, o projeto **não possui** configuração de PWA ativa em:
- `next.config.mjs` (sem plug-in `next-pwa`).
- `public/` (sem `manifest.json` ou `sw.js`).
- `package.json` (sem dependências de PWA).

**Recomendação**: Para evitar conflitos de cache e melhorar a performance, devemos:
1. Adicionar um script de "desinstalação de emergência" de Service Workers no `RootLayout` para limpar instâncias antigas de usuários.
2. Configurar o PWA formalmente usando `next-pwa` se o objetivo for permitir instalação e offline.

## 3. Análise de Performance e Navegação

### Gargalos Identificados
1. **Configuração Restritiva no `next.config.mjs`**:
   - `fastRefresh: false`: Desabilita a atualização instantânea em desenvolvimento, o que pode causar estados inconsistentes durante o desenvolvimento que parecem "bugs" de navegação.
   - `swcMinify: false`: Desabilita a minificação moderna do Next.js, aumentando o tamanho do bundle.

2. **Wrapper `ClientOnly` Onipresente**:
   - O uso do componente `ClientOnly` em todo o `RootLayout` força a exibição de um spinner até que a hidratação ocorra. Se houver qualquer atraso no JS, o usuário fica preso no carregamento.

3. **Cálculos Pesados no Render**:
   - Em `HomePage`, o cálculo de distância para todos os serviços é feito diretamente no corpo do componente. À medida que a lista de serviços cresce, isso impactará a fluidez da rolagem e navegação.

4. **Estado de Loading Global**:
   - O `ProtectedLayout` bloqueia toda a tela com um spinner enquanto `loading` no `useApp` for verdadeiro. Chamadas lentas ao Supabase no mount do app travam o usuário nessa tela.

## 4. Plano de Otimização e Soluções

### Curto Prazo (Correção de Bugs)
- [ ] **Limpeza de Service Workers**: Adicionar código no `layout.tsx` para detectar e desregistrar Service Workers não autorizados.
- [ ] **Correção de Hidratação**: Identificar componentes que usam datas, localizações ou estados dinâmicos (como `userAvatar`) e garantir que usem `useEffect` ou `suppressHydrationWarning`.
- [ ] **Reativar Fast Refresh**: Voltar para `fastRefresh: true` no `next.config.mjs` para garantir integridade no desenvolvimento.

### Médio Prazo (Performance)
- [ ] **Memoização**: Usar `useMemo` para o cálculo de `servicesWithDistance` na `HomePage`.
- [ ] **Skeleton Screens**: Substituir o spinner global de tela cheia por *Skeletons* específicos por seção, permitindo que a estrutura da página apareça antes dos dados.
- [ ] **Otimização de Chunks**: Configurar `loading.tsx` em rotas críticas para aproveitar o streaming do Next.js 14.

### Longo Prazo (Progressive Web App)
- [ ] **Implementar PWA Real**: Configurar `next-pwa` com estratégias de cache `NetworkFirst` para o HTML e `CacheFirst` para assets estáticos, garantindo que o usuário sempre tenha a versão mais recente.

---
*Documento gerado por Antigravity em 31/03/2026*
