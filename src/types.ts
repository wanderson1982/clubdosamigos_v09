export interface Atleta {
  id: string | number;
  codigo: string;
  nome: string;
  time: 'Azul' | 'Vermelho';
  camisa: string;
  status: 'Ativo' | 'Inativo' | 'Depto. Médico';
  dataCadastro: string;
  dataInativacao?: string;
  obs: string;
  isFixo?: boolean;
  historicoTimes?: ('Azul' | 'Vermelho')[];
  dataNascimento?: string;
  posicaoPrincipal?: string;
  posicaoSecundaria?: string;
  classificacao?: 'Atleta' | 'Membro Diretoria';
  pontuacao?: number;
}

export interface LancamentoFinanceiro {
  id: string | number;
  atletaId: string | number;
  valor: number;
  dataPagamento: string;
  mesReferencia: string;
  anoReferencia: number;
  status: 'Pago' | 'Pendente';
  tipo: 'Normal' | 'Social';
  cestaBasica: boolean;
}

export interface Gol {
  id: string | number;
  atletaId: string | number;
  quantidade: number; // Positivo para Pró, Negativo para Contra
  tipo: 'Pró' | 'Contra';
  rodada: number;
  data: string;
}

export interface AppDatabase {
  atletas: Atleta[];
  financeiro: LancamentoFinanceiro[];
  gols: Gol[];
}
