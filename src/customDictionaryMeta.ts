export type DictKey = 'npSet' | 'cpSet' | 'cpCaretSet' | 'vvSet' | 'vaSet';

export type DictCategoryMeta = {
  title: string;
  subtitle: string;
  helper: string;
};

export const DICT_CATEGORY_LABELS: Record<DictKey, DictCategoryMeta> = {
  npSet: {
    title: '고유명사 사전',
    subtitle: 'np_set · WORD_LIST',
    helper: '인명, 작품명, 브랜드 등 단일 명사',
  },
  cpSet: {
    title: '복합명사 사전',
    subtitle: 'cp_set · WORD_LIST',
    helper: '여러 단어로 이루어진 복합 명사',
  },
  cpCaretSet: {
    title: '복합명사 분리 사전',
    subtitle: 'cp_caret_set · WORD_LIST_COMPOUND',
    helper: '`디지털^인문학`처럼 ^로 구분된 복합 명사',
  },
  vvSet: {
    title: '동사 사전',
    subtitle: 'vv_set · WORD_LIST',
    helper: '새로운 동사/용언',
  },
  vaSet: {
    title: '형용사 사전',
    subtitle: 'va_set · WORD_LIST',
    helper: '형용사 및 형용사적 표현',
  },
};
