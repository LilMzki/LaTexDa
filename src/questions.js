const q = (id, level, category, answer, render = answer) => ({
  id,
  level,
  category,
  answer,
  render,
});

/**
 * The answer is intentionally canonical rather than accepting every equivalent
 * TeX spelling. LaTexDa is a notation drill, so the exact displayed answer is
 * the string the player is asked to reproduce.
 */
export const QUESTIONS = [
  // Level 1 — symbols and short structures
  q("power", 1, "上付き", String.raw`x^2`),
  q("subscript", 1, "下付き", String.raw`a_n`),
  q("mixed-index", 1, "添字", String.raw`x_1+x_2`),
  q("simple-fraction", 1, "分数", String.raw`\frac{1}{2}`),
  q("literal-fraction", 1, "分数", String.raw`\frac{a}{b}`),
  q("square-root", 1, "根号", String.raw`\sqrt{x}`),
  q("cube-root", 1, "根号", String.raw`\sqrt[3]{x}`),
  q("circle-area", 1, "ギリシャ文字", String.raw`\pi r^2`),
  q("plus-minus", 1, "演算子", String.raw`x\pm y`),
  q("alpha-beta", 1, "ギリシャ文字", String.raw`\alpha+\beta`),
  q("theta-half-pi", 1, "ギリシャ文字", String.raw`\theta=\frac{\pi}{2}`),
  q("sine", 1, "関数", String.raw`\sin x`),
  q("cosine", 1, "関数", String.raw`\cos\theta`),
  q("logarithm", 1, "関数", String.raw`\log_2 x`),
  q("absolute", 1, "括弧", String.raw`|x|`),
  q("infinity", 1, "記号", String.raw`x\to\infty`),
  q("less-equal", 1, "関係記号", String.raw`a\leq b`),
  q("not-equal", 1, "関係記号", String.raw`a\neq b`),
  q("vector", 1, "装飾", String.raw`\vec{v}`),
  q("overline", 1, "装飾", String.raw`\overline{AB}`),
  q("hat", 1, "装飾", String.raw`\hat{x}`),
  q("sum-short", 1, "総和", String.raw`\sum_{i=1}^{n}i`),
  q("product-short", 1, "総乗", String.raw`\prod_{k=1}^{n}k`),
  q("integral-basic", 1, "積分", String.raw`\int_0^1 x\,dx`),
  q("binomial", 1, "組合せ", String.raw`\binom{n}{k}`),
  q("set-membership", 1, "集合", String.raw`x\in A`),
  q("real-numbers", 1, "集合", String.raw`x\in\mathbb{R}`),
  q("union", 1, "集合", String.raw`A\cup B`),
  q("intersection", 1, "集合", String.raw`A\cap B`),
  q("logical-arrow", 1, "論理", String.raw`P\Rightarrow Q`),

  // Level 2 — common formulas and environments
  q("pythagorean", 2, "方程式", String.raw`x^2+y^2=z^2`),
  q("quadratic", 2, "方程式", String.raw`x=\frac{-b\pm\sqrt{b^2-4ac}}{2a}`),
  q("arithmetic-sum", 2, "総和", String.raw`\sum_{k=1}^{n}k=\frac{n(n+1)}{2}`),
  q("geometric-sum", 2, "総和", String.raw`\sum_{k=0}^{n}r^k=\frac{1-r^{n+1}}{1-r}`),
  q("derivative", 2, "微分", String.raw`\frac{d}{dx}x^n=nx^{n-1}`),
  q("partial", 2, "偏微分", String.raw`\frac{\partial f}{\partial x}`),
  q("limit", 2, "極限", String.raw`\lim_{x\to0}\frac{\sin x}{x}=1`),
  q("exponential-limit", 2, "極限", String.raw`\lim_{n\to\infty}\left(1+\frac{1}{n}\right)^n=e`),
  q("definite-integral", 2, "積分", String.raw`\int_a^b f(x)\,dx`),
  q("double-integral", 2, "積分", String.raw`\iint_D f(x,y)\,dA`),
  q("matrix-two", 2, "行列", String.raw`\begin{pmatrix}a&b\\c&d\end{pmatrix}`),
  q("determinant-two", 2, "行列", String.raw`\det\begin{pmatrix}a&b\\c&d\end{pmatrix}=ad-bc`),
  q("cases-absolute", 2, "場合分け", String.raw`|x|=\begin{cases}x&x\geq0\\-x&x<0\end{cases}`),
  q("piecewise", 2, "場合分け", String.raw`f(x)=\begin{cases}x^2&x\geq0\\-x&x<0\end{cases}`),
  q("dot-product", 2, "ベクトル", String.raw`\vec{a}\cdot\vec{b}=|\vec{a}||\vec{b}|\cos\theta`),
  q("cross-product", 2, "ベクトル", String.raw`\vec{a}\times\vec{b}`),
  q("complex-euler", 2, "複素数", String.raw`e^{i\theta}=\cos\theta+i\sin\theta`),
  q("complex-modulus", 2, "複素数", String.raw`|z|=\sqrt{x^2+y^2}`),
  q("probability", 2, "確率", String.raw`P(A\mid B)=\frac{P(A\cap B)}{P(B)}`),
  q("expectation", 2, "確率", String.raw`\mathbb{E}[X]=\sum_x xP(X=x)`),
  q("variance", 2, "確率", String.raw`\operatorname{Var}(X)=\mathbb{E}[X^2]-\mathbb{E}[X]^2`),
  q("normal-density", 2, "確率", String.raw`f(x)=\frac{1}{\sqrt{2\pi\sigma^2}}e^{-\frac{(x-\mu)^2}{2\sigma^2}}`),
  q("subset", 2, "集合", String.raw`A\subseteq B`),
  q("set-builder", 2, "集合", String.raw`A=\{x\in\mathbb{R}\mid x>0\}`),
  q("forall-exists", 2, "論理", String.raw`\forall x\in A,\exists y\in B`),
  q("floor-ceil", 2, "括弧", String.raw`\lfloor x\rfloor\leq x\leq\lceil x\rceil`),
  q("norm", 2, "括弧", String.raw`\|\vec{x}\|_2=\sqrt{\sum_{i=1}^{n}x_i^2}`),
  q("underbrace", 2, "装飾", String.raw`\underbrace{a+b+\cdots+z}_{26}`),
  q("continued-fraction", 2, "分数", String.raw`1+\frac{1}{1+\frac{1}{x}}`),
  q("multiline-array", 2, "行列", String.raw`A=\begin{bmatrix}1&0\\0&1\end{bmatrix}`),

  // Level 3 — longer identities and advanced notation
  q("gaussian-integral", 3, "解析", String.raw`\int_{-\infty}^{\infty}e^{-x^2}\,dx=\sqrt{\pi}`),
  q("integration-parts", 3, "解析", String.raw`\int u\,dv=uv-\int v\,du`),
  q("taylor", 3, "解析", String.raw`f(x)=\sum_{n=0}^{\infty}\frac{f^{(n)}(a)}{n!}(x-a)^n`),
  q("fourier", 3, "解析", String.raw`\hat{f}(\xi)=\int_{-\infty}^{\infty}f(x)e^{-2\pi i x\xi}\,dx`),
  q("cauchy-schwarz", 3, "不等式", String.raw`\left|\sum_{i=1}^{n}a_i b_i\right|^2\leq\left(\sum_{i=1}^{n}a_i^2\right)\left(\sum_{i=1}^{n}b_i^2\right)`),
  q("stirling", 3, "漸近", String.raw`n!\sim\sqrt{2\pi n}\left(\frac{n}{e}\right)^n`),
  q("bayes", 3, "確率", String.raw`P(A\mid B)=\frac{P(B\mid A)P(A)}{P(B)}`),
  q("entropy", 3, "情報", String.raw`H(X)=-\sum_x p(x)\log p(x)`),
  q("gradient", 3, "ベクトル解析", String.raw`\nabla f=\left(\frac{\partial f}{\partial x_1},\ldots,\frac{\partial f}{\partial x_n}\right)`),
  q("divergence", 3, "ベクトル解析", String.raw`\nabla\cdot\vec{F}=\frac{\partial F_x}{\partial x}+\frac{\partial F_y}{\partial y}+\frac{\partial F_z}{\partial z}`),
  q("curl", 3, "ベクトル解析", String.raw`\nabla\times\vec{F}`),
  q("green", 3, "ベクトル解析", String.raw`\oint_C(P\,dx+Q\,dy)=\iint_D\left(\frac{\partial Q}{\partial x}-\frac{\partial P}{\partial y}\right)dA`),
  q("eigenvalue", 3, "線形代数", String.raw`A\vec{v}=\lambda\vec{v}`),
  q("characteristic", 3, "線形代数", String.raw`\det(A-\lambda I)=0`),
  q("svd", 3, "線形代数", String.raw`A=U\Sigma V^{\mathsf{T}}`),
  q("maxwell-gauss", 3, "物理", String.raw`\nabla\cdot\vec{E}=\frac{\rho}{\varepsilon_0}`),
  q("schrodinger", 3, "物理", String.raw`i\hbar\frac{\partial}{\partial t}\Psi=\hat{H}\Psi`),
  q("relativity", 3, "物理", String.raw`E^2=(pc)^2+(mc^2)^2`),
  q("lagrangian", 3, "物理", String.raw`\frac{d}{dt}\frac{\partial L}{\partial\dot{q}}-\frac{\partial L}{\partial q}=0`),
  q("dirac", 3, "物理", String.raw`\langle\phi\mid\psi\rangle`),
  q("residue", 3, "複素解析", String.raw`\oint_C f(z)\,dz=2\pi i\sum_k\operatorname{Res}(f,a_k)`),
  q("gamma", 3, "特殊関数", String.raw`\Gamma(s)=\int_0^{\infty}x^{s-1}e^{-x}\,dx`),
  q("zeta", 3, "特殊関数", String.raw`\zeta(s)=\sum_{n=1}^{\infty}\frac{1}{n^s}`),
  q("riemann-hypothesis", 3, "特殊関数", String.raw`\zeta(s)=0\Rightarrow\operatorname{Re}(s)=\frac{1}{2}`),
  q("tensor", 3, "テンソル", String.raw`T^{\mu}_{\ \nu}=g^{\mu\alpha}T_{\alpha\nu}`),
  q("commutator", 3, "演算子", String.raw`[\hat{x},\hat{p}]=i\hbar`),
  q("kronecker", 3, "記号", String.raw`\delta_{ij}=\begin{cases}1&i=j\\0&i\neq j\end{cases}`),
  q("laplace", 3, "変換", String.raw`\mathcal{L}\{f(t)\}(s)=\int_0^{\infty}e^{-st}f(t)\,dt`),
  q("convolution", 3, "変換", String.raw`(f*g)(t)=\int_{-\infty}^{\infty}f(\tau)g(t-\tau)\,d\tau`),
  q("softmax", 3, "機械学習", String.raw`\operatorname{softmax}(z_i)=\frac{e^{z_i}}{\sum_{j=1}^{K}e^{z_j}}`),
];

export const DIFFICULTIES = Object.freeze({
  beginner: {
    label: "初級",
    description: "短い記法を中心に練習",
    levels: [1],
  },
  standard: {
    label: "標準",
    description: "基本から定番公式まで",
    levels: [1, 2],
  },
  expert: {
    label: "上級",
    description: "長い式と高度な記法",
    levels: [2, 3],
  },
});

export function questionsForDifficulty(difficulty) {
  const config = DIFFICULTIES[difficulty] ?? DIFFICULTIES.standard;
  return QUESTIONS.filter((question) => config.levels.includes(question.level));
}
