const raw = String.raw;

/**
 * 問題は表示用の数式と、打鍵するLaTeX文字列を同一にしています。
 * difficulty: 1 = 基礎 / 2 = 標準 / 3 = 発展
 */
export const QUESTIONS = Object.freeze([
  {
    id: "basic-power",
    latex: raw`x^2`,
    difficulty: 1,
    category: "上付き文字"
  },
  {
    id: "basic-subscript",
    latex: raw`a_n`,
    difficulty: 1,
    category: "下付き文字"
  },
  {
    id: "basic-fraction",
    latex: raw`\frac{1}{2}`,
    difficulty: 1,
    category: "分数"
  },
  {
    id: "basic-root",
    latex: raw`\sqrt{x}`,
    difficulty: 1,
    category: "平方根"
  },
  {
    id: "basic-pi",
    latex: raw`\pi r^2`,
    difficulty: 1,
    category: "ギリシャ文字"
  },
  {
    id: "basic-alpha-beta",
    latex: raw`\alpha+\beta`,
    difficulty: 1,
    category: "ギリシャ文字"
  },
  {
    id: "basic-trig",
    latex: raw`\sin x`,
    difficulty: 1,
    category: "関数"
  },
  {
    id: "basic-log",
    latex: raw`\log x`,
    difficulty: 1,
    category: "関数"
  },
  {
    id: "basic-infinity",
    latex: raw`x\to\infty`,
    difficulty: 1,
    category: "記号"
  },
  {
    id: "basic-inequality",
    latex: raw`x\leq y`,
    difficulty: 1,
    category: "不等号"
  },
  {
    id: "basic-set",
    latex: raw`A\cap B`,
    difficulty: 1,
    category: "集合"
  },
  {
    id: "basic-vector",
    latex: raw`\vec{v}`,
    difficulty: 1,
    category: "装飾"
  },
  {
    id: "basic-overline",
    latex: raw`\overline{AB}`,
    difficulty: 1,
    category: "装飾"
  },
  {
    id: "basic-absolute",
    latex: raw`\lvert x\rvert`,
    difficulty: 1,
    category: "括弧"
  },
  {
    id: "basic-euler",
    latex: raw`e^{i\pi}+1=0`,
    difficulty: 1,
    category: "指数"
  },
  {
    id: "standard-sum",
    latex: raw`\sum_{k=1}^{n}k`,
    difficulty: 2,
    category: "総和"
  },
  {
    id: "standard-product",
    latex: raw`\prod_{i=1}^{n}i`,
    difficulty: 2,
    category: "総乗"
  },
  {
    id: "standard-integral",
    latex: raw`\int_0^1 x^2\,dx`,
    difficulty: 2,
    category: "積分"
  },
  {
    id: "standard-limit",
    latex: raw`\lim_{x\to0}\frac{\sin x}{x}=1`,
    difficulty: 2,
    category: "極限"
  },
  {
    id: "standard-binomial",
    latex: raw`\binom{n}{k}`,
    difficulty: 2,
    category: "組合せ"
  },
  {
    id: "standard-delimiter",
    latex: raw`\left(x+1\right)^2`,
    difficulty: 2,
    category: "可変括弧"
  },
  {
    id: "standard-real",
    latex: raw`x\in\mathbb{R}`,
    difficulty: 2,
    category: "集合"
  },
  {
    id: "standard-forall",
    latex: raw`\forall x\in\mathbb{R}`,
    difficulty: 2,
    category: "論理"
  },
  {
    id: "standard-exists",
    latex: raw`\exists n\in\mathbb{N}`,
    difficulty: 2,
    category: "論理"
  },
  {
    id: "standard-partial",
    latex: raw`\frac{\partial f}{\partial x}`,
    difficulty: 2,
    category: "偏微分"
  },
  {
    id: "standard-gradient",
    latex: raw`\nabla\cdot\vec{F}`,
    difficulty: 2,
    category: "ベクトル解析"
  },
  {
    id: "standard-inner-product",
    latex: raw`\langle u,v\rangle`,
    difficulty: 2,
    category: "内積"
  },
  {
    id: "standard-matrix",
    latex: raw`\begin{pmatrix}a&b\\c&d\end{pmatrix}`,
    difficulty: 2,
    category: "行列"
  },
  {
    id: "standard-cases",
    latex: raw`\begin{cases}x+y=1\\x-y=0\end{cases}`,
    difficulty: 2,
    category: "場合分け"
  },
  {
    id: "standard-derivative",
    latex: raw`\frac{d}{dx}x^n=nx^{n-1}`,
    difficulty: 2,
    category: "微分"
  },
  {
    id: "hard-gaussian",
    latex: raw`\int_{-\infty}^{\infty}e^{-x^2}\,dx=\sqrt{\pi}`,
    difficulty: 3,
    category: "広義積分"
  },
  {
    id: "hard-basel",
    latex: raw`\sum_{n=1}^{\infty}\frac{1}{n^2}=\frac{\pi^2}{6}`,
    difficulty: 3,
    category: "無限級数"
  },
  {
    id: "hard-determinant",
    latex: raw`\det\begin{pmatrix}a&b\\c&d\end{pmatrix}=ad-bc`,
    difficulty: 3,
    category: "行列式"
  },
  {
    id: "hard-evaluation",
    latex: raw`\left.\frac{d}{dx}f(x)\right|_{x=0}`,
    difficulty: 3,
    category: "評価記号"
  },
  {
    id: "hard-line-integral",
    latex: raw`\oint_C\vec{F}\cdot d\vec{r}`,
    difficulty: 3,
    category: "線積分"
  },
  {
    id: "hard-wave-equation",
    latex: raw`\frac{\partial^2 u}{\partial t^2}=c^2\nabla^2u`,
    difficulty: 3,
    category: "偏微分方程式"
  },
  {
    id: "hard-laplace",
    latex: raw`\mathcal{L}\{f(t)\}=\int_0^\infty e^{-st}f(t)\,dt`,
    difficulty: 3,
    category: "ラプラス変換"
  },
  {
    id: "hard-binomial-distribution",
    latex: raw`\Pr(X=k)=\binom{n}{k}p^k(1-p)^{n-k}`,
    difficulty: 3,
    category: "確率"
  },
  {
    id: "hard-aligned",
    latex: raw`\begin{aligned}a&=b+c\\d&=e-f\end{aligned}`,
    difficulty: 3,
    category: "数式揃え"
  },
  {
    id: "hard-sequence",
    latex: raw`\left\{\frac{a_n}{b_n}\right\}_{n=1}^{\infty}`,
    difficulty: 3,
    category: "数列"
  },
  {
    id: "hard-fourier",
    latex: raw`\hat{f}(\xi)=\int_{-\infty}^{\infty}f(x)e^{-2\pi i x\xi}\,dx`,
    difficulty: 3,
    category: "フーリエ変換"
  },
  {
    id: "hard-taylor",
    latex: raw`f(x)=\sum_{n=0}^{\infty}\frac{f^{(n)}(a)}{n!}(x-a)^n`,
    difficulty: 3,
    category: "テイラー展開"
  },
  {
    id: "hard-maxwell",
    latex: raw`\nabla\times\vec{E}=-\frac{\partial\vec{B}}{\partial t}`,
    difficulty: 3,
    category: "ベクトル解析"
  },
  {
    id: "hard-expectation",
    latex: raw`\mathbb{E}[X]=\sum_x x\Pr(X=x)`,
    difficulty: 3,
    category: "期待値"
  },
  {
    id: "hard-rank-nullity",
    latex: raw`\operatorname{rank}(A)+\operatorname{nullity}(A)=n`,
    difficulty: 3,
    category: "線形代数"
  }
]);
