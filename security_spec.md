# Security Specification - Arena Osman Loureiro

## Data Invariants
1. **Atletas**: Must have a non-empty name, a valid team (Azul/Vermelho), and a classification. `dataCadastro` must be a valid date.
2. **Financeiro**: Must reference an existing `atletaId`. `valor` must be positive.
3. **Gols**: Must reference an existing `atletaId`. `quantidade` must be non-zero.

## The Dirty Dozen (Test Payloads)

1. **Identity Spoofing (Atletas)**: Attempt to create an athlete document where `ownerId` is set to another user's UID (if we implement ownership).
2. **Resource Poisoning (Atletas)**: Attempt to inject a 1MB string into the `nome` field.
3. **State Shortcutting (Financeiro)**: Attempt to update a financial record from 'Pendente' to 'Pago' without providing a `dataPagamento`.
4. **Invalid Enum (Atletas)**: Attempt to set `time` to "Amarelo".
5. **Orphaned Record (Gols)**: Attempt to create a goal record referencing a non-existent `atletaId`.
6. **Self-Promotion (Admin)**: Attempt to create a document in an `/admins/` collection.
7. **Bypassing Verification**: Attempt to write data from an account with `email_verified: false`.
8. **Shadow Field Injection**: Attempt to create an athlete with a hidden `isAdmin: true` field.
9. **Zero-Value Exploitation (Financeiro)**: Attempt to create a payment with `valor: 0`.
10. **Historical Tampering (Atletas)**: Attempt to overwrite `dataCadastro` during an update.
11. **PII Leakage**: Authenticated user trying to read `/users/` private data of another user.
12. **Mass Goal Injection**: Attempt to create a goal with `quantidade: 999`.

## Test Runner Plan
We will use `firestore.rules.test.ts` to verify these payloads against the generated rules.
