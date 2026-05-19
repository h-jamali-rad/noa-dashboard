/**
 * model-showcase-data.tsx
 *
 * Source of truth for the model showcase: types, category color tokens,
 * scientific SVG architecture illustrations, and the full ALL_MODELS array.
 *
 * Note: file uses the .tsx extension because each `svgIcon` is a real React
 * functional component containing inline JSX. The dataset itself remains
 * pure data — only the icon factory functions use JSX.
 */

import React from 'react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type ModelCategory =
  | 'Gradient Boosting'
  | 'Ensemble'
  | 'Linear'
  | 'Tree'
  | 'Neural'
  | 'Probabilistic'
  | 'Distance'
  | 'Kernel';

export interface ModelMetrics {
  auc: number;
  accuracy: number;
  sensitivity: number;
  specificity: number;
  f1: number;
  /** Only populated for v2 AUC – a string like "0.823–0.845". */
  ci?: string;
}

export interface CategoryColor {
  /** Translucent background for chips, cards, glassmorphism. */
  bg: string;
  /** Border tint for cards / chips. */
  border: string;
  /** Foreground/text color on dark surfaces. */
  text: string;
  /** Solid accent (used in gradients, ring, dot, etc.). */
  accent: string;
}

export interface ModelShowcaseItem {
  id: string;
  name: string;
  category: ModelCategory;
  /** Plain-language explanation of how the algorithm works. */
  description: string;
  /** Why this model was a sensible candidate for the dataset. */
  selectionReasoning: string;
  isChampion: boolean;
  isV2: boolean;
  v1Metrics: ModelMetrics;
  v2Metrics?: ModelMetrics;
  rank: number;
  categoryColor: CategoryColor;
  /** React component that renders an architecture illustration (~80×80). */
  svgIcon: React.FC<{ className?: string; size?: number }>;
}

/* ------------------------------------------------------------------ */
/*  Category color tokens                                              */
/*  Tailwind class names – all chosen for legibility on slate-900/950. */
/* ------------------------------------------------------------------ */

export const CATEGORY_COLORS: Record<ModelCategory, CategoryColor> = {
  'Gradient Boosting': {
    bg: 'bg-amber-500/10',
    border: 'border-amber-400/30',
    text: 'text-amber-300',
    accent: 'from-amber-400 to-orange-500',
  },
  Ensemble: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-400/30',
    text: 'text-emerald-300',
    accent: 'from-emerald-400 to-teal-500',
  },
  Linear: {
    bg: 'bg-sky-500/10',
    border: 'border-sky-400/30',
    text: 'text-sky-300',
    accent: 'from-sky-400 to-blue-500',
  },
  Tree: {
    bg: 'bg-lime-500/10',
    border: 'border-lime-400/30',
    text: 'text-lime-300',
    accent: 'from-lime-400 to-green-500',
  },
  Neural: {
    bg: 'bg-violet-500/10',
    border: 'border-violet-400/30',
    text: 'text-violet-300',
    accent: 'from-violet-400 to-fuchsia-500',
  },
  Probabilistic: {
    bg: 'bg-rose-500/10',
    border: 'border-rose-400/30',
    text: 'text-rose-300',
    accent: 'from-rose-400 to-pink-500',
  },
  Distance: {
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-400/30',
    text: 'text-cyan-300',
    accent: 'from-cyan-400 to-sky-500',
  },
  Kernel: {
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-400/30',
    text: 'text-indigo-300',
    accent: 'from-indigo-400 to-purple-500',
  },
};

/* ------------------------------------------------------------------ */
/*  SVG building blocks                                                */
/*  All icons share an 80×80 viewBox, use currentColor for stroke      */
/*  and fill so the category color flows in via Tailwind text-*.       */
/* ------------------------------------------------------------------ */

type IconProps = { className?: string; size?: number };

const SvgBase: React.FC<
  IconProps & { children: React.ReactNode; title?: string }
> = ({ className, size = 80, children, title }) => (
  <svg
    viewBox="0 0 80 80"
    width={size}
    height={size}
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth={1.6}
    strokeLinecap="round"
    strokeLinejoin="round"
    role="img"
    aria-label={title}
  >
    {title ? <title>{title}</title> : null}
    {children}
  </svg>
);

/* --- Small reusable primitives ------------------------------------- */

const Dot = ({ cx, cy, r = 2.4 }: { cx: number; cy: number; r?: number }) => (
  <circle cx={cx} cy={cy} r={r} fill="currentColor" stroke="none" />
);

const Arrow = ({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) => {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const len = 3;
  const ax1 = x2 - len * Math.cos(angle - Math.PI / 7);
  const ay1 = y2 - len * Math.sin(angle - Math.PI / 7);
  const ax2 = x2 - len * Math.cos(angle + Math.PI / 7);
  const ay2 = y2 - len * Math.sin(angle + Math.PI / 7);
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} />
      <polyline points={`${ax1},${ay1} ${x2},${y2} ${ax2},${ay2}`} />
    </g>
  );
};

/** A tiny generic tree glyph used inside the boosting / forest icons. */
const MiniTree = ({
  cx,
  cy,
  scale = 1,
  variant = 'triangle',
}: {
  cx: number;
  cy: number;
  scale?: number;
  variant?: 'triangle' | 'symmetric' | 'leafwise';
}) => {
  const s = scale;
  if (variant === 'symmetric') {
    // Symmetric / oblivious tree – balanced binary structure
    return (
      <g transform={`translate(${cx - 8 * s} ${cy - 8 * s}) scale(${s})`}>
        <circle cx={8} cy={2} r={1.6} fill="currentColor" stroke="none" />
        <line x1={8} y1={2} x2={3} y2={8} />
        <line x1={8} y1={2} x2={13} y2={8} />
        <line x1={3} y1={8} x2={1} y2={14} />
        <line x1={3} y1={8} x2={5} y2={14} />
        <line x1={13} y1={8} x2={11} y2={14} />
        <line x1={13} y1={8} x2={15} y2={14} />
      </g>
    );
  }
  if (variant === 'leafwise') {
    // Asymmetric – grows one leaf at a time
    return (
      <g transform={`translate(${cx - 8 * s} ${cy - 8 * s}) scale(${s})`}>
        <circle cx={8} cy={2} r={1.6} fill="currentColor" stroke="none" />
        <line x1={8} y1={2} x2={4} y2={8} />
        <line x1={8} y1={2} x2={12} y2={8} />
        <line x1={12} y1={8} x2={9} y2={14} />
        <line x1={12} y1={8} x2={15} y2={14} />
        <line x1={15} y1={14} x2={14} y2={16} />
      </g>
    );
  }
  // Simple triangle tree
  return (
    <g transform={`translate(${cx - 8 * s} ${cy - 8 * s}) scale(${s})`}>
      <path d="M8 1 L1 15 L15 15 Z" />
      <line x1={8} y1={15} x2={8} y2={17} />
    </g>
  );
};

/* ------------------------------------------------------------------ */
/*  Per-model SVG icons                                                */
/* ------------------------------------------------------------------ */

/* --- Gradient Boosting family: sequential trees + arrows ----------- */

const LightGBMIcon: React.FC<IconProps> = (p) => (
  <SvgBase {...p} title="LightGBM architecture">
    <MiniTree cx={16} cy={32} scale={0.9} variant="leafwise" />
    <MiniTree cx={40} cy={32} scale={1.05} variant="leafwise" />
    <MiniTree cx={64} cy={32} scale={1.2} variant="leafwise" />
    <Arrow x1={26} y1={36} x2={32} y2={36} />
    <Arrow x1={50} y1={36} x2={56} y2={36} />
    <text x={40} y={64} textAnchor="middle" fontSize={7} fill="currentColor" stroke="none">
      leaf-wise growth
    </text>
  </SvgBase>
);

const XGBoostIcon: React.FC<IconProps> = (p) => (
  <SvgBase {...p} title="XGBoost architecture">
    <MiniTree cx={14} cy={30} scale={0.95} />
    <MiniTree cx={40} cy={30} scale={0.95} />
    <MiniTree cx={66} cy={30} scale={0.95} />
    <Arrow x1={22} y1={32} x2={32} y2={32} />
    <Arrow x1={48} y1={32} x2={58} y2={32} />
    <text x={27} y={50} textAnchor="middle" fontSize={9} fill="currentColor" stroke="none">+</text>
    <text x={53} y={50} textAnchor="middle" fontSize={9} fill="currentColor" stroke="none">+</text>
    <path d="M10 60 L70 60" />
    <text x={40} y={70} textAnchor="middle" fontSize={6} fill="currentColor" stroke="none">
      additive boosting
    </text>
  </SvgBase>
);

const CatBoostIcon: React.FC<IconProps> = (p) => (
  <SvgBase {...p} title="CatBoost architecture">
    <MiniTree cx={14} cy={28} scale={1} variant="symmetric" />
    <MiniTree cx={40} cy={28} scale={1} variant="symmetric" />
    <MiniTree cx={66} cy={28} scale={1} variant="symmetric" />
    <Arrow x1={22} y1={32} x2={32} y2={32} />
    <Arrow x1={48} y1={32} x2={58} y2={32} />
    <path d="M10 56 Q40 50 70 56" />
    <text x={40} y={68} textAnchor="middle" fontSize={6} fill="currentColor" stroke="none">
      ordered &amp; symmetric
    </text>
  </SvgBase>
);

const GradientBoostingIcon: React.FC<IconProps> = (p) => (
  <SvgBase {...p} title="Gradient Boosting architecture">
    <MiniTree cx={16} cy={30} scale={0.85} />
    <MiniTree cx={40} cy={30} scale={0.85} />
    <MiniTree cx={64} cy={30} scale={0.85} />
    <Arrow x1={24} y1={32} x2={32} y2={32} />
    <Arrow x1={48} y1={32} x2={56} y2={32} />
    <path d="M10 56 L70 56" strokeDasharray="2 2" />
    <text x={40} y={68} textAnchor="middle" fontSize={6} fill="currentColor" stroke="none">
      gradient steps
    </text>
  </SvgBase>
);

/* --- Ensemble family ----------------------------------------------- */

const RandomForestIcon: React.FC<IconProps> = (p) => (
  <SvgBase {...p} title="Random Forest architecture">
    <MiniTree cx={16} cy={36} scale={1.1} />
    <MiniTree cx={40} cy={36} scale={1.1} />
    <MiniTree cx={64} cy={36} scale={1.1} />
    {/* aggregation bar */}
    <path d="M10 58 L70 58" />
    <line x1={16} y1={54} x2={16} y2={58} />
    <line x1={40} y1={54} x2={40} y2={58} />
    <line x1={64} y1={54} x2={64} y2={58} />
    <Arrow x1={40} y1={58} x2={40} y2={70} />
    <text x={56} y={72} fontSize={6} fill="currentColor" stroke="none">avg</text>
  </SvgBase>
);

const StackingIcon: React.FC<IconProps> = (p) => (
  <SvgBase {...p} title="Stacking ensemble architecture">
    {/* base learners */}
    <rect x={6} y={50} width={16} height={12} rx={2} />
    <rect x={32} y={50} width={16} height={12} rx={2} />
    <rect x={58} y={50} width={16} height={12} rx={2} />
    {/* arrows up */}
    <Arrow x1={14} y1={50} x2={30} y2={28} />
    <Arrow x1={40} y1={50} x2={40} y2={28} />
    <Arrow x1={66} y1={50} x2={50} y2={28} />
    {/* meta learner */}
    <rect x={26} y={14} width={28} height={14} rx={3} />
    <text x={40} y={24} textAnchor="middle" fontSize={6} fill="currentColor" stroke="none">
      meta
    </text>
  </SvgBase>
);

const VotingIcon: React.FC<IconProps> = (p) => (
  <SvgBase {...p} title="Voting ensemble architecture">
    <rect x={6} y={14} width={18} height={12} rx={2} />
    <rect x={6} y={34} width={18} height={12} rx={2} />
    <rect x={6} y={54} width={18} height={12} rx={2} />
    <Arrow x1={24} y1={20} x2={48} y2={36} />
    <Arrow x1={24} y1={40} x2={48} y2={40} />
    <Arrow x1={24} y1={60} x2={48} y2={44} />
    {/* ballot box */}
    <rect x={48} y={28} width={26} height={24} rx={2} />
    <path d="M54 38 L58 42 L66 32" />
  </SvgBase>
);

/* --- Decision Tree ------------------------------------------------- */

const DecisionTreeIcon: React.FC<IconProps> = (p) => (
  <SvgBase {...p} title="Decision tree architecture">
    <circle cx={40} cy={14} r={3.2} />
    <line x1={40} y1={17} x2={22} y2={36} />
    <line x1={40} y1={17} x2={58} y2={36} />
    <circle cx={22} cy={38} r={3} />
    <circle cx={58} cy={38} r={3} />
    <line x1={22} y1={41} x2={12} y2={60} />
    <line x1={22} y1={41} x2={32} y2={60} />
    <line x1={58} y1={41} x2={48} y2={60} />
    <line x1={58} y1={41} x2={68} y2={60} />
    <Dot cx={12} cy={62} r={2.4} />
    <Dot cx={32} cy={62} r={2.4} />
    <Dot cx={48} cy={62} r={2.4} />
    <Dot cx={68} cy={62} r={2.4} />
  </SvgBase>
);

/* --- Neural Network (MLP) ----------------------------------------- */

const MLPIcon: React.FC<IconProps> = (p) => {
  const layers = [
    [18, 30, 42, 54],
    [14, 30, 46, 62],
    [22, 40, 58],
  ];
  const xs = [16, 40, 64];
  return (
    <SvgBase {...p} title="Multi-layer perceptron architecture">
      {layers.map((ys, i) =>
        ys.map((y, j) => <Dot key={`n-${i}-${j}`} cx={xs[i]} cy={y} r={2.6} />),
      )}
      {/* Connections layer 0 -> 1 */}
      {layers[0].flatMap((y1, j) =>
        layers[1].map((y2, k) => (
          <line key={`e1-${j}-${k}`} x1={xs[0]} y1={y1} x2={xs[1]} y2={y2} strokeWidth={0.6} />
        )),
      )}
      {/* Connections layer 1 -> 2 */}
      {layers[1].flatMap((y1, j) =>
        layers[2].map((y2, k) => (
          <line key={`e2-${j}-${k}`} x1={xs[1]} y1={y1} x2={xs[2]} y2={y2} strokeWidth={0.6} />
        )),
      )}
    </SvgBase>
  );
};

/* --- Linear models: hyperplane + dots ------------------------------ */

const LinearBase: React.FC<
  IconProps & {
    label: string;
    extra?: React.ReactNode;
    /** Color the positive-class points filled (default true). */
    filledPos?: boolean;
  }
> = ({ label, extra, filledPos = true, ...rest }) => (
  <SvgBase {...rest} title={`${label} decision boundary`}>
    {/* separating hyperplane */}
    <line x1={10} y1={62} x2={70} y2={18} />
    {/* positive class */}
    <Dot cx={20} cy={28} />
    <Dot cx={32} cy={22} />
    <Dot cx={44} cy={18} />
    <Dot cx={52} cy={24} />
    {/* negative class as circles */}
    <circle cx={26} cy={56} r={2.6} />
    <circle cx={40} cy={58} r={2.6} />
    <circle cx={54} cy={52} r={2.6} />
    <circle cx={62} cy={46} r={2.6} />
    {!filledPos ? null : null}
    {extra}
    <text x={40} y={74} textAnchor="middle" fontSize={6} fill="currentColor" stroke="none">
      {label}
    </text>
  </SvgBase>
);

const LogisticRegressionIcon: React.FC<IconProps> = (p) => (
  <SvgBase {...p} title="Logistic regression sigmoid">
    {/* axes */}
    <line x1={8} y1={64} x2={72} y2={64} />
    <line x1={8} y1={64} x2={8} y2={10} />
    {/* sigmoid curve */}
    <path
      d="M8 60 C24 60, 30 56, 36 44 S52 18, 72 18"
      strokeWidth={2}
    />
    {/* threshold line */}
    <line x1={8} y1={36} x2={72} y2={36} strokeDasharray="2 2" />
    <text x={40} y={76} textAnchor="middle" fontSize={6} fill="currentColor" stroke="none">
      σ(wᵀx + b)
    </text>
  </SvgBase>
);

const RidgeIcon: React.FC<IconProps> = (p) => (
  <LinearBase
    {...p}
    label="L2 (ridge)"
    extra={
      <>
        {/* L2 regularization ring */}
        <circle cx={40} cy={40} r={20} strokeDasharray="2 2" />
        <circle cx={40} cy={40} r={14} strokeDasharray="2 2" />
      </>
    }
  />
);

const ElasticNetIcon: React.FC<IconProps> = (p) => (
  <LinearBase
    {...p}
    label="L1 + L2"
    extra={
      <>
        <rect x={26} y={26} width={28} height={28} strokeDasharray="2 2" />
        <circle cx={40} cy={40} r={14} strokeDasharray="2 2" />
      </>
    }
  />
);

const LassoIcon: React.FC<IconProps> = (p) => (
  <LinearBase
    {...p}
    label="L1 (lasso)"
    extra={
      <>
        {/* L1 diamond */}
        <path d="M40 22 L58 40 L40 58 L22 40 Z" strokeDasharray="2 2" />
      </>
    }
  />
);

/* --- KNN ----------------------------------------------------------- */

const KNNIcon: React.FC<IconProps> = (p) => (
  <SvgBase {...p} title="K-nearest neighbors">
    {/* query point at center */}
    <circle cx={40} cy={40} r={3.4} fill="currentColor" stroke="none" />
    {/* k-rings */}
    <circle cx={40} cy={40} r={14} strokeDasharray="2 2" />
    <circle cx={40} cy={40} r={22} strokeDasharray="2 2" />
    {/* neighbors (filled = positive, hollow = negative) */}
    <Dot cx={48} cy={32} />
    <Dot cx={32} cy={34} />
    <Dot cx={44} cy={50} />
    <circle cx={28} cy={50} r={2.6} />
    <circle cx={56} cy={48} r={2.6} />
    <circle cx={20} cy={28} r={2.6} />
    <circle cx={60} cy={26} r={2.6} />
  </SvgBase>
);

/* --- SVM ----------------------------------------------------------- */

const SVMIcon: React.FC<IconProps> = (p) => (
  <SvgBase {...p} title="SVM with RBF kernel">
    {/* margin lines (parallel) */}
    <line x1={10} y1={56} x2={70} y2={20} strokeDasharray="3 2" />
    <line x1={10} y1={70} x2={70} y2={34} strokeDasharray="3 2" />
    {/* separating hyperplane */}
    <line x1={10} y1={63} x2={70} y2={27} strokeWidth={2} />
    {/* positive class points */}
    <Dot cx={22} cy={22} />
    <Dot cx={36} cy={18} />
    <Dot cx={50} cy={22} />
    {/* support vectors (positive – ringed) */}
    <circle cx={30} cy={32} r={4} />
    <Dot cx={30} cy={32} />
    {/* negative class points */}
    <circle cx={28} cy={62} r={2.6} />
    <circle cx={48} cy={56} r={2.6} />
    <circle cx={62} cy={46} r={2.6} />
    {/* support vector (negative – ringed) */}
    <circle cx={52} cy={42} r={4} />
    <circle cx={52} cy={42} r={2.6} />
  </SvgBase>
);

/* --- Naive Bayes --------------------------------------------------- */

const NaiveBayesIcon: React.FC<IconProps> = (p) => (
  <SvgBase {...p} title="Naive Bayes probability distributions">
    {/* baseline */}
    <line x1={6} y1={60} x2={74} y2={60} />
    {/* class A bell curve */}
    <path d="M6 60 C18 60, 22 18, 32 18 C42 18, 46 60, 58 60" strokeWidth={1.8} />
    {/* class B bell curve */}
    <path d="M22 60 C34 60, 38 24, 48 24 C58 24, 62 60, 74 60" strokeWidth={1.8} strokeDasharray="3 2" />
    {/* decision boundary */}
    <line x1={40} y1={60} x2={40} y2={18} strokeDasharray="1 2" />
    <text x={40} y={74} textAnchor="middle" fontSize={6} fill="currentColor" stroke="none">
      P(y) · ∏ P(xᵢ|y)
    </text>
  </SvgBase>
);

/* ------------------------------------------------------------------ */
/*  Internal helper to assemble metric objects from the raw JSON       */
/* ------------------------------------------------------------------ */

function v1(
  auc: number,
  accuracy: number,
  sensitivity: number,
  specificity: number,
  f1: number,
): ModelMetrics {
  return { auc, accuracy, sensitivity, specificity, f1 };
}

function v2(
  auc: number | string,
  ci: string,
  accuracy: number,
  sensitivity: number,
  specificity: number,
  f1: number,
): ModelMetrics {
  return {
    auc: typeof auc === 'string' ? Number(auc) : auc,
    accuracy,
    sensitivity,
    specificity,
    f1,
    ci: ci && ci.length > 0 ? ci : undefined,
  };
}

/* ------------------------------------------------------------------ */
/*  ALL_MODELS                                                         */
/* ------------------------------------------------------------------ */

export const ALL_MODELS: ModelShowcaseItem[] = [
  {
    id: 'lightgbm',
    name: 'LightGBM',
    category: 'Gradient Boosting',
    rank: 1,
    isChampion: false,
    isV2: true,
    description:
      "Builds an ensemble of decision trees one at a time, where each new tree focuses on the examples the previous trees got wrong. LightGBM uses 'leaf-wise' growth and gradient-based one-side sampling to train extremely fast on tabular data while keeping memory low.",
    selectionReasoning:
      'Purpose-built for tabular data with mixed numeric and categorical features. Native class-weight support handles the 1.72:1 imbalance, histogram-based splits scale efficiently to the 73-feature space, and it is robust to feature scaling — a strong fit for the 2,413 × 73 cohort.',
    v1Metrics: v1(0.7327, 0.6913, 0.5926, 0.7485, 0.585),
    v2Metrics: v2('0.8213', '0.809–0.836', 0.755, 0.681, 0.798, 0.671),
    categoryColor: CATEGORY_COLORS['Gradient Boosting'],
    svgIcon: LightGBMIcon,
  },
  {
    id: 'gradient-boosting',
    name: 'Gradient Boosting',
    category: 'Gradient Boosting',
    rank: 2,
    isChampion: false,
    isV2: false,
    description:
      'Classical gradient boosting from scikit-learn. Trees are fit one after another to the negative gradient of the loss function, producing an additive model built in a forward stage-wise manner.',
    selectionReasoning:
      'Reference implementation included as a controlled comparison against modern boosters. Establishes the lift that LightGBM, XGBoost and CatBoost achieve through histogram splits, second-order optimization and ordered boosting on this dataset.',
    v1Metrics: v1(0.7291, 0.6933, 0.57, 0.7649, 0.5769),
    categoryColor: CATEGORY_COLORS['Gradient Boosting'],
    svgIcon: GradientBoostingIcon,
  },
  {
    id: 'xgboost',
    name: 'XGBoost',
    category: 'Gradient Boosting',
    rank: 3,
    isChampion: false,
    isV2: true,
    description:
      'Gradient-boosted decision trees with second-order (Newton) optimization, shrinkage and aggressive L1/L2 regularization. Each new tree corrects the residual errors of all previous trees in a sequential additive ensemble.',
    selectionReasoning:
      'Industry-standard boosted tree with strong built-in regularization — useful to control variance in the 73-feature space. Provides an excellent baseline for binary classification with moderate imbalance and competes closely with LightGBM and CatBoost on tabular benchmarks.',
    v1Metrics: v1(0.724, 0.6809, 0.5892, 0.7341, 0.5748),
    v2Metrics: v2('0.8214', '0.814–0.835', 0.758, 0.669, 0.809, 0.669),
    categoryColor: CATEGORY_COLORS['Gradient Boosting'],
    svgIcon: XGBoostIcon,
  },
  {
    id: 'stacking-ensemble',
    name: 'Stacking Ensemble',
    category: 'Ensemble',
    rank: 4,
    isChampion: false,
    isV2: false,
    description:
      'Meta-learning approach: several diverse base classifiers are trained on the data, and a final meta-learner (typically logistic regression) is trained on their out-of-fold predictions. The meta-learner discovers which base model to trust under which conditions.',
    selectionReasoning:
      'Combines decision boundaries from heterogeneous learners. Effective when no single algorithm dominates, but the lift over the strongest base model is modest here because gradient boosters already capture most of the signal in 73-feature tabular data.',
    v1Metrics: v1(0.7222, 0.6817, 0.5655, 0.7492, 0.5663),
    categoryColor: CATEGORY_COLORS.Ensemble,
    svgIcon: StackingIcon,
  },
  {
    id: 'catboost',
    name: 'CatBoost',
    category: 'Gradient Boosting',
    rank: 5,
    isChampion: true,
    isV2: true,
    description:
      'Gradient boosting using symmetric (oblivious) decision trees and an ordered boosting scheme that prevents target leakage during target-statistic encoding. Handles categorical features natively without manual one-hot encoding.',
    selectionReasoning:
      'Champion model. Excels on heterogeneous tabular data with categorical features, requires minimal hyperparameter tuning, and reaches AUC 0.8306 (95% CI: 0.823–0.845) — the strongest discriminator on this 2,413-sample, 1.72:1 imbalanced cohort.',
    v1Metrics: v1(0.7187, 0.6759, 0.5767, 0.7335, 0.5668),
    v2Metrics: v2('0.8306', '0.823–0.845', 0.77, 0.678, 0.823, 0.684),
    categoryColor: CATEGORY_COLORS['Gradient Boosting'],
    svgIcon: CatBoostIcon,
  },
  {
    id: 'random-forest',
    name: 'Random Forest',
    category: 'Ensemble',
    rank: 6,
    isChampion: false,
    isV2: true,
    description:
      'Trains many decision trees in parallel on bootstrap samples of the data; each tree considers only a random subset of features at every split. Final predictions are obtained by majority vote or averaged probabilities across all trees.',
    selectionReasoning:
      'Low-tuning ensemble that handles mixed feature types, missing values and the 1.72:1 imbalance without preprocessing. Acts as a strong non-boosted ensemble baseline and supplies interpretable feature-importance estimates for the 73 predictors.',
    v1Metrics: v1(0.7186, 0.6734, 0.5655, 0.7361, 0.5594),
    v2Metrics: v2('0.8157', '0.809–0.829', 0.747, 0.664, 0.795, 0.66),
    categoryColor: CATEGORY_COLORS.Ensemble,
    svgIcon: RandomForestIcon,
  },
  {
    id: 'voting-ensemble',
    name: 'Voting Ensemble',
    category: 'Ensemble',
    rank: 7,
    isChampion: false,
    isV2: false,
    description:
      'Aggregates predictions from multiple independently trained classifiers either by majority vote (hard voting) or by averaging class probabilities (soft voting). Relies on the wisdom-of-the-crowd effect when base models make uncorrelated errors.',
    selectionReasoning:
      'Simplest ensemble strategy — included as a transparent baseline. Effective when base learners disagree informatively, but the lift is limited here because the top performers (boosting variants) already agree on the strongest signals.',
    v1Metrics: v1(0.706, 0.683, 0.4819, 0.7996, 0.5279),
    categoryColor: CATEGORY_COLORS.Ensemble,
    svgIcon: VotingIcon,
  },
  {
    id: 'mlp',
    name: 'MLP (Neural Network)',
    category: 'Neural',
    rank: 8,
    isChampion: false,
    isV2: false,
    description:
      'A multi-layer perceptron with one or more hidden layers of fully-connected neurons and non-linear activations (ReLU/tanh). Trained via backpropagation to minimise binary cross-entropy.',
    selectionReasoning:
      'Captures complex non-linear interactions among the 73 features, but with only 2,413 samples it tends to overfit and underperform tree-based methods. Included as a representative of deep learning on this dataset size.',
    v1Metrics: v1(0.6696, 0.6515, 0.4673, 0.7584, 0.4964),
    categoryColor: CATEGORY_COLORS.Neural,
    svgIcon: MLPIcon,
  },
  {
    id: 'ridge-classifier',
    name: 'Ridge Classifier',
    category: 'Linear',
    rank: 9,
    isChampion: false,
    isV2: false,
    description:
      'Linear classifier that converts the binary target to {-1, +1} and fits least-squares regression with an L2 (ridge) penalty on coefficients. The class prediction is the sign of the regression output.',
    selectionReasoning:
      'Regularized linear baseline that controls coefficient magnitudes in the 73-dimensional feature space. Quantifies how much of the signal is linearly separable before introducing non-linear methods.',
    v1Metrics: v1(0.6681, 0.615, 0.6535, 0.5928, 0.5537),
    categoryColor: CATEGORY_COLORS.Linear,
    svgIcon: RidgeIcon,
  },
  {
    id: 'knn',
    name: 'K-Nearest Neighbors',
    category: 'Distance',
    rank: 10,
    isChampion: false,
    isV2: false,
    description:
      'A lazy, non-parametric classifier: it stores every training example and predicts each new sample by majority vote among its K closest neighbours in feature space (typically Euclidean distance).',
    selectionReasoning:
      'Distance-based baseline that is sensitive to feature scaling and the curse of dimensionality. With 73 features and only 2,413 samples it underperforms tree ensembles, illustrating that local proximity alone does not capture this dataset’s signal.',
    v1Metrics: v1(0.6521, 0.5661, 0.7088, 0.4833, 0.5442),
    categoryColor: CATEGORY_COLORS.Distance,
    svgIcon: KNNIcon,
  },
  {
    id: 'logistic-regression',
    name: 'Logistic Regression',
    category: 'Linear',
    rank: 11,
    isChampion: false,
    isV2: true,
    description:
      'Fits a linear combination of features through a logistic (sigmoid) link function to produce calibrated probability estimates of the positive class. Trained by maximum likelihood with optional L1/L2 regularization.',
    selectionReasoning:
      'Canonical interpretable baseline used widely in clinical and educational research — each coefficient maps to an odds ratio. In the v2 pipeline with proper feature engineering it reaches AUC 0.7926, making it the strongest interpretable model.',
    v1Metrics: v1(0.6469, 0.6225, 0.5226, 0.6805, 0.5058),
    // Secondary v2 metrics are zeroed in the source data — kept as 0 so the
    // UI can render "—" for any zero value. CI is empty (undefined).
    v2Metrics: v2('0.7926', '', 0.0, 0.0, 0.0, 0.0),
    categoryColor: CATEGORY_COLORS.Linear,
    svgIcon: LogisticRegressionIcon,
  },
  {
    id: 'decision-tree',
    name: 'Decision Tree',
    category: 'Tree',
    rank: 12,
    isChampion: false,
    isV2: false,
    description:
      'Recursively splits the feature space on the most informative variable at each node (using Gini impurity or entropy), producing a sequence of if-then rules that lead to a leaf-level class prediction.',
    selectionReasoning:
      'Maximally interpretable — every decision can be traced as a human-readable rule. Suffers from high variance on its own, but provides the conceptual building block for the ensemble methods that dominate this benchmark.',
    v1Metrics: v1(0.6457, 0.6204, 0.5147, 0.6817, 0.4975),
    categoryColor: CATEGORY_COLORS.Tree,
    svgIcon: DecisionTreeIcon,
  },
  {
    id: 'elastic-net',
    name: 'Elastic Net',
    category: 'Linear',
    rank: 13,
    isChampion: false,
    isV2: false,
    description:
      'A linear model that combines L1 (Lasso) and L2 (Ridge) penalties. The mixed penalty encourages both sparse solutions and stable coefficient estimates when predictors are correlated.',
    selectionReasoning:
      'Useful when groups of correlated predictors exist among the 73 features — the mixed penalty often selects entire correlated groups. On this dataset the linear assumption limits ceiling performance.',
    v1Metrics: v1(0.595, 0.5048, 0.7788, 0.346, 0.5355),
    categoryColor: CATEGORY_COLORS.Linear,
    svgIcon: ElasticNetIcon,
  },
  {
    id: 'lasso',
    name: 'Lasso (L1)',
    category: 'Linear',
    rank: 14,
    isChampion: false,
    isV2: false,
    description:
      'A linear classifier with an L1 penalty that drives many coefficients exactly to zero, performing automatic feature selection while fitting the model.',
    selectionReasoning:
      'Sparsity-inducing baseline that identifies the small number of features carrying linear signal. Highlights the limitation of purely linear methods on this dataset — most of the predictive structure is non-linear.',
    v1Metrics: v1(0.5949, 0.6631, 0.2246, 0.9174, 0.2591),
    categoryColor: CATEGORY_COLORS.Linear,
    svgIcon: LassoIcon,
  },
  {
    id: 'svm-rbf',
    name: 'SVM (RBF)',
    category: 'Kernel',
    rank: 15,
    isChampion: false,
    isV2: false,
    description:
      'A maximum-margin classifier that finds the hyperplane separating classes with the widest gap. The RBF kernel implicitly maps inputs into an infinite-dimensional space, allowing curved decision boundaries in the original feature space.',
    selectionReasoning:
      'Kernel-based non-linear baseline. Highly sensitive to feature scaling and the C / γ hyperparameters; on a 2,413-sample dataset with class imbalance it struggles to find a balanced margin and underperforms tree ensembles.',
    v1Metrics: v1(0.5473, 0.6403, 0.2991, 0.8381, 0.2775),
    categoryColor: CATEGORY_COLORS.Kernel,
    svgIcon: SVMIcon,
  },
  {
    id: 'naive-bayes',
    name: 'Naive Bayes',
    category: 'Probabilistic',
    rank: 16,
    isChampion: false,
    isV2: false,
    description:
      "A probabilistic classifier that applies Bayes' theorem assuming all features are conditionally independent given the class. Predictions select the class with the highest posterior probability.",
    selectionReasoning:
      'Probabilistic baseline with a strong (rarely true) independence assumption. Included to demonstrate the discriminative cost of ignoring feature interactions on this 73-feature cohort.',
    v1Metrics: v1(0.5232, 0.4443, 0.8205, 0.2259, 0.5202),
    categoryColor: CATEGORY_COLORS.Probabilistic,
    svgIcon: NaiveBayesIcon,
  },
];

/* ------------------------------------------------------------------ */
/*  Convenience derived constants (handy for the showcase UI)         */
/* ------------------------------------------------------------------ */

export const MODEL_CATEGORIES: ModelCategory[] = [
  'Gradient Boosting',
  'Ensemble',
  'Linear',
  'Tree',
  'Neural',
  'Probabilistic',
  'Distance',
  'Kernel',
];

/** Best AUC available for a model (v2 preferred, else v1). */
export function bestAuc(m: ModelShowcaseItem): number {
  return m.v2Metrics?.auc ?? m.v1Metrics.auc;
}
