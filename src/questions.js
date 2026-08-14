export const QUESTION_BANK = Object.freeze([
  {
    id: "square-sum",
    level: "easy",
    latex: "x^2 + y^2 = z^2",
    answer: "x^2 + y^2 = z^2",
    topic: "上付き文字"
  },
  {
    id: "simple-fraction",
    level: "easy",
    latex: "\\frac{1}{2}",
    answer: "\\frac{1}{2}",
    topic: "分数"
  },
  {
    id: "square-root",
    level: "easy",
    latex: "\\sqrt{x}",
    answer: "\\sqrt{x}",
    topic: "平方根"
  },
  {
    id: "greek-letters",
    level: "easy",
    latex: "\\alpha + \\beta = \\gamma",
    answer: "\\alpha + \\beta = \\gamma",
    topic: "ギリシャ文字"
  },
  {
    id: "euler-identity",
    level: "easy",
    latex: "e^{i\\pi}+1=0",
    answer: "e^{i\\pi}+1=0",
    topic: "指数"
  },
  {
    id: "finite-sum",
    level: "easy",
    latex: "\\sum_{k=1}^{n} k",
    answer: "\\sum_{k=1}^{n} k",
    topic: "総和"
  },
  {
    id: "definite-integral",
    level: "easy",
    latex: "\\int_0^1 x^2\\,dx",
    answer: "\\int_0^1 x^2\\,dx",
    topic: "積分"
  },
  {
    id: "sine-limit",
    level: "easy",
    latex: "\\lim_{x\\to 0} \\frac{\\sin x}{x}=1",
    answer: "\\lim_{x\\to 0} \\frac{\\sin x}{x}=1",
    topic: "極限"
  },
  {
    id: "binomial",
    level: "easy",
    latex: "\\binom{n}{r}",
    answer: "\\binom{n}{r}",
    topic: "二項係数"
  },
  {
    id: "overline",
    level: "easy",
    latex: "\\overline{AB}",
    answer: "\\overline{AB}",
    topic: "装飾"
  },
  {
    id: "absolute-value",
    level: "easy",
    latex: "|x-a| < \\varepsilon",
    answer: "|x-a| < \\varepsilon",
    topic: "不等式"
  },
  {
    id: "nth-root",
    level: "easy",
    latex: "\\sqrt[n]{x}",
    answer: "\\sqrt[n]{x}",
    topic: "n乗根"
  },
  {
    id: "quadratic-formula",
    level: "medium",
    latex: "x=\\frac{-b\\pm\\sqrt{b^2-4ac}}{2a}",
    answer: "x=\\frac{-b\\pm\\sqrt{b^2-4ac}}{2a}",
    topic: "二次方程式"
  },
  {
    id: "product",
    level: "medium",
    latex: "\\prod_{k=1}^{n} k=n!",
    answer: "\\prod_{k=1}^{n} k=n!",
    topic: "総乗"
  },
  {
    id: "parentheses-power",
    level: "medium",
    latex: "\\left(\\frac{x}{y}\\right)^n",
    answer: "\\left(\\frac{x}{y}\\right)^n",
    topic: "可変括弧"
  },
  {
    id: "gauss-law",
    level: "medium",
    latex: "\\nabla\\cdot\\mathbf{E}=\\frac{\\rho}{\\varepsilon_0}",
    answer: "\\nabla\\cdot\\mathbf{E}=\\frac{\\rho}{\\varepsilon_0}",
    topic: "ベクトル解析"
  },
  {
    id: "matrix",
    level: "medium",
    latex: "\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}",
    answer: "\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}",
    topic: "行列"
  },
  {
    id: "epsilon-delta",
    level: "medium",
    latex: "\\forall \\varepsilon>0,\\ \\exists \\delta>0",
    answer: "\\forall \\varepsilon>0,\\ \\exists \\delta>0",
    topic: "量化記号"
  },
  {
    id: "real-vector-space",
    level: "medium",
    latex: "\\mathbb{R}^n",
    answer: "\\mathbb{R}^n",
    topic: "黒板太字"
  },
  {
    id: "dot-product",
    level: "medium",
    latex: "\\vec{a}\\cdot\\vec{b}=|\\vec{a}||\\vec{b}|\\cos\\theta",
    answer: "\\vec{a}\\cdot\\vec{b}=|\\vec{a}||\\vec{b}|\\cos\\theta",
    topic: "内積"
  },
  {
    id: "log-change-base",
    level: "medium",
    latex: "\\log_a b=\\frac{\\ln b}{\\ln a}",
    answer: "\\log_a b=\\frac{\\ln b}{\\ln a}",
    topic: "対数"
  },
  {
    id: "gaussian-integral",
    level: "medium",
    latex: "\\int_{-\\infty}^{\\infty}e^{-x^2}\\,dx=\\sqrt{\\pi}",
    answer: "\\int_{-\\infty}^{\\infty}e^{-x^2}\\,dx=\\sqrt{\\pi}",
    topic: "広義積分"
  },
  {
    id: "set-builder",
    level: "medium",
    latex: "A=\\{x\\in\\mathbb{R}\\mid x>0\\}",
    answer: "A=\\{x\\in\\mathbb{R}\\mid x>0\\}",
    topic: "集合"
  },
  {
    id: "piecewise-small",
    level: "medium",
    latex: "|x|=\\begin{cases}x & x\\ge 0\\\\-x & x<0\\end{cases}",
    answer: "|x|=\\begin{cases}x & x\\ge 0\\\\-x & x<0\\end{cases}",
    topic: "場合分け"
  },
  {
    id: "heat-equation",
    level: "hard",
    latex: "\\frac{\\partial u}{\\partial t}=\\alpha\\nabla^2u",
    answer: "\\frac{\\partial u}{\\partial t}=\\alpha\\nabla^2u",
    topic: "偏微分"
  },
  {
    id: "line-integral",
    level: "hard",
    latex: "\\oint_C\\mathbf{F}\\cdot d\\mathbf{r}",
    answer: "\\oint_C\\mathbf{F}\\cdot d\\mathbf{r}",
    topic: "線積分"
  },
  {
    id: "aligned-equations",
    level: "hard",
    latex: "\\begin{aligned} a&=b+c\\\\ d&=e-f \\end{aligned}",
    answer: "\\begin{aligned} a&=b+c\\\\ d&=e-f \\end{aligned}",
    topic: "数式揃え"
  },
  {
    id: "eigenvalue",
    level: "hard",
    latex: "\\det(A-\\lambda I)=0",
    answer: "\\det(A-\\lambda I)=0",
    topic: "固有値"
  },
  {
    id: "basel-problem",
    level: "hard",
    latex: "\\sum_{n=1}^{\\infty}\\frac{1}{n^2}=\\frac{\\pi^2}{6}",
    answer: "\\sum_{n=1}^{\\infty}\\frac{1}{n^2}=\\frac{\\pi^2}{6}",
    topic: "無限級数"
  },
  {
    id: "fourier-transform",
    level: "hard",
    latex: "\\mathcal{F}\\{f(t)\\}(\\omega)=\\int_{-\\infty}^{\\infty}f(t)e^{-i\\omega t}\\,dt",
    answer: "\\mathcal{F}\\{f(t)\\}(\\omega)=\\int_{-\\infty}^{\\infty}f(t)e^{-i\\omega t}\\,dt",
    topic: "フーリエ変換"
  },
  {
    id: "evaluated-derivative",
    level: "hard",
    latex: "\\left.\\frac{d}{dx}f(x)\\right|_{x=a}",
    answer: "\\left.\\frac{d}{dx}f(x)\\right|_{x=a}",
    topic: "評価記号"
  },
  {
    id: "rank",
    level: "hard",
    latex: "\\operatorname{rank}(A)=n",
    answer: "\\operatorname{rank}(A)=n",
    topic: "演算子名"
  },
  {
    id: "simultaneous-equations",
    level: "hard",
    latex: "\\begin{cases}x+y=1\\\\x-y=0\\end{cases}",
    answer: "\\begin{cases}x+y=1\\\\x-y=0\\end{cases}",
    topic: "連立方程式"
  },
  {
    id: "inner-product",
    level: "hard",
    latex: "\\left\\langle x,y\\right\\rangle=\\sum_{i=1}^{n}x_i y_i",
    answer: "\\left\\langle x,y\\right\\rangle=\\sum_{i=1}^{n}x_i y_i",
    topic: "内積記号"
  },
  {
    id: "taylor-series",
    level: "hard",
    latex: "f(x)=\\sum_{n=0}^{\\infty}\\frac{f^{(n)}(a)}{n!}(x-a)^n",
    answer: "f(x)=\\sum_{n=0}^{\\infty}\\frac{f^{(n)}(a)}{n!}(x-a)^n",
    topic: "テイラー展開"
  },
  {
    id: "maxwell-faraday",
    level: "hard",
    latex: "\\nabla\\times\\mathbf{E}=-\\frac{\\partial\\mathbf{B}}{\\partial t}",
    answer: "\\nabla\\times\\mathbf{E}=-\\frac{\\partial\\mathbf{B}}{\\partial t}",
    topic: "回転"
  }
]);
