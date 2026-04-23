import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface KeyboardOptions {
  onRefresh:      () => void;
  onToggleDark:   () => void;
  onShowShortcuts: () => void;
}

export const SHORTCUTS = [
  { keys: ['D'],        description: 'Ir para Dashboard'       },
  { keys: ['R'],        description: 'Ir para Relatórios'      },
  { keys: ['E'],        description: 'Ir para Exportar'        },
  { keys: ['L'],        description: 'Ir para Lançamentos'     },
  { keys: ['M'],        description: 'Ir para Metas'           },
  { keys: ['A'],        description: 'Ir para Alertas'         },
  { keys: ['C'],        description: 'Ir para Configurações'   },
  { keys: ['Ctrl','R'], description: 'Atualizar dados'         },
  { keys: ['T'],        description: 'Alternar tema claro/escuro'},
  { keys: ['?'],        description: 'Mostrar atalhos'         },
];

export function useKeyboard({ onRefresh, onToggleDark, onShowShortcuts }: KeyboardOptions) {
  const navigate = useNavigate();

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      // Ignora se o foco está num input/textarea/select
      const tag = (e.target as HTMLElement).tagName;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;

      if (e.ctrlKey && e.key === 'r') {
        e.preventDefault();
        onRefresh();
        return;
      }
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      switch (e.key.toUpperCase()) {
        case 'D': navigate('/');             break;
        case 'R': navigate('/relatorios');   break;
        case 'E': navigate('/exportar');     break;
        case 'L': navigate('/lancamentos');  break;
        case 'M': navigate('/metas');        break;
        case 'A': navigate('/alertas');      break;
        case 'C': navigate('/configuracoes');break;
        case 'T': onToggleDark();            break;
        case '?': onShowShortcuts();         break;
      }
    }

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate, onRefresh, onToggleDark, onShowShortcuts]);
}
