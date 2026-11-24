# Envio às lojas · Neruz Inspect

Textos: `listing.pt-BR.md`, `listing.en.md`, `listing.es.md`. Formulário de privacidade da Chrome e notas ao revisor do AMO: `justificativas.md`.
Confira tamanhos e limites no painel no dia do envio; as lojas mudam regras sem aviso.

## Antes de qualquer envio
- [x] Corrigir os achados A1 e M1 do relatório de segurança (revisores questionam fetch para redes privadas)
- [ ] Decidir o resumo curto: manter o `extDescription` atual ou trocar pela proposta das fichas (Chrome lê o resumo do manifest, então a troca precisa estar em `apps/inspect/public/_locales/*/messages.json` antes do build)
- [x] Repositório https://github.com/brunolucassf/neruz-inspect público, com LICENSE (MIT)
- [x] Landing no ar em https://inspect.neruz.tech com as políticas abertas: `/privacy/` (pt), `/en/privacy/`, `/es/privacy/` (não existe rota `/privacidade`)
- [x] Política de privacidade cita o carregamento do Google Fonts em "Testar fonte" e as permissões opcionais (hoje cita as permissões, não cita o Google Fonts)
- [x] Conferir se o histórico de cópias é opcional (a política diz "se você ativar"; a ARQUITETURA diz que grava sempre os últimos 50). Alinhar código ou texto
- [x] Build de produção: `version` do manifest atualizado; zip Chrome e zip Firefox gerados pelo WXT
- [x] Imagens finais com a identidade oficial (lista abaixo)
- [x] Bruno escreve "pode publicar" (2026-11-22)

## Imagens
| Peça | Tamanho | Chrome | AMO | Observação |
|---|---|---|---|---|
| Ícone | 128x128 PNG | Obrigatório | Usa o do manifest; pode subir 128x128 | Arte em 96x96 com 16 px de respiro em cada lado na Chrome |
| Capturas | 1280x800 PNG/JPG | 1 a 5 (obrigatório ao menos 1) | Várias, com legenda | Chrome: cenas 1, 2, 3, 4 e 6. AMO: as 6 |
| Bloco promocional pequeno | 440x280 | Obrigatório | Não usa | Texto ≤6 palavras das fichas |
| Banner (marquee) | 1400x560 | Opcional | Não usa | Necessário só para destaque na loja |
| Vídeo | URL do YouTube | Opcional | Não usa | Sem vídeo por ora |

Capturas: site real como protagonista, barra e painel por cima, sem dados pessoais visíveis. Uma versão por idioma se a arte tiver texto (pt, en, es).

## Chrome Web Store
**Pacote:** zip do build Chrome.

**Aba Ficha da loja (por idioma: en padrão, pt_BR, es)**
- [ ] Descrição: descrição longa da ficha do idioma (resumo e nome vêm do manifest)
- [ ] Categoria: Productivity > Developer Tools
- [ ] Idioma da ficha
- [ ] Ícone 128, capturas, bloco 440x280, banner 1400x560 (opcional)
- [ ] Site oficial: https://inspect.neruz.tech (verificar o domínio no Google Search Console para aparecer como oficial)
- [ ] Página inicial: https://inspect.neruz.tech
- [ ] URL de suporte: https://github.com/brunolucassf/neruz-inspect/issues
- [ ] Conteúdo adulto: não

**Aba Práticas de privacidade** (textos em `justificativas.md`)
- [ ] Finalidade única
- [ ] Justificativa: activeTab, scripting, storage, clipboardWrite, permissões de host
- [ ] Código remoto: Não
- [ ] Uso de dados: marcar só "User activity" (estatística anônima de uso) + 3 certificações de uso limitado
- [ ] Política publicada com a seção de estatística anônima (conferir `/en/privacy/` no ar antes de enviar)
- [ ] URL da política: https://inspect.neruz.tech/en/privacy/

**Aba Distribuição**
- [ ] Gratuito, sem compras no app
- [ ] Visibilidade: pública (ou não listada para teste)
- [ ] Regiões: todas

**Conta**
- [ ] E-mail de contato verificado no painel do desenvolvedor (pendente com Bruno)

## Firefox AMO
**Pacote:** zip do build Firefox + código-fonte gerado com git archive e BUILD-FIREFOX.md (o sources.zip do WXT omite packages/ e o lockfile; não usar) (ID `neruz-inspect@fontedev.com`, Firefox 128+, `data_collection_permissions`: `required: none` e `optional: technicalAndInteraction` no manifest, por causa da estatística anônima de uso).

- [ ] Distribuição: no site (listado)
- [ ] Código-fonte: enviar zip do código, porque o build é empacotado pelo WXT. Incluir no README do zip: versão do Node e do pnpm, `pnpm install` e o comando de build do Firefox
- [ ] Nome: Neruz Inspect
- [ ] URL do complemento (slug): `neruz-inspect`
- [ ] Resumo (≤250): resumo AMO da ficha (en padrão; pt-BR e es como traduções)
- [ ] Descrição: descrição longa da ficha
- [ ] Categoria: Web Development
- [ ] Tags: escolher na lista fixa do AMO as que baterem com a sugestão das fichas
- [ ] Licença: MIT
- [ ] Política de privacidade: agora há envio de estatística (opcional no Firefox), então preencher com a URL ou o texto da página `/en/privacy/`
- [ ] Ficha do AMO: informar que o complemento pede a permissão opcional de dados técnicos e de interação
- [ ] E-mail e site de suporte: https://github.com/brunolucassf/neruz-inspect/issues e https://inspect.neruz.tech
- [ ] Página inicial: https://inspect.neruz.tech
- [ ] Notas ao revisor: bloco "Firefox AMO · notes to reviewer" de `justificativas.md`
- [ ] Ícone e capturas com legenda (6 cenas)

## Edge Add-ons (quando for enviar)
Reaproveita o zip e os textos da Chrome. Logo 300x300 no lugar do ícone 128; capturas 1280x800; bloco 440x280 e banner 1400x560 opcionais.
