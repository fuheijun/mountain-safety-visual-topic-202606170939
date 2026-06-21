const axisCopy = {
  risk: {
    kicker: "Axis 01",
    title: "风险内容",
    copy:
      "先看材料具体讲了哪些风险。不能只记录“注意安全”，而要拆到天气、路线、装备、身体状态、团队行为和应急处置。"
  },
  level: {
    kicker: "Axis 02",
    title: "知识层级",
    copy:
      "再看安全知识讲到什么程度。识别层回答“有什么风险”，判断层回答“是否需要调整”，行动层回答“下一步怎么做”，迁移层提供可复用规则。"
  },
  visual: {
    kicker: "Axis 03",
    title: "视觉表达",
    copy:
      "最后看风险知识如何被视觉组织。图标、清单、地图、流程和对比不是装饰，而是影响公众阅读顺序和行动理解的结构。"
  }
};

const axisButtons = document.querySelectorAll(".axis-item");
const axisKicker = document.querySelector("#axis-kicker");
const axisTitle = document.querySelector("#axis-title");
const axisText = document.querySelector("#axis-copy");

axisButtons.forEach((button) => {
  const activate = () => {
    const data = axisCopy[button.dataset.axis];
    if (!data) return;
    axisButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    axisKicker.textContent = data.kicker;
    axisTitle.textContent = data.title;
    axisText.textContent = data.copy;
  };

  button.addEventListener("mouseenter", activate);
  button.addEventListener("focus", activate);
  button.addEventListener("click", activate);
});

const filterButtons = document.querySelectorAll(".filter-button");
const materialCards = document.querySelectorAll(".material-card");

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;
    filterButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");

    materialCards.forEach((card) => {
      const categories = card.dataset.category || "";
      card.hidden = filter !== "all" && !categories.includes(filter);
    });
  });
});

const navLinks = [...document.querySelectorAll(".nav-links a")];
const sections = navLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

const observer = new IntersectionObserver(
  (entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (!visible) return;

    navLinks.forEach((link) => {
      const isActive = link.getAttribute("href") === `#${visible.target.id}`;
      link.toggleAttribute("aria-current", isActive);
    });
  },
  { threshold: [0.18, 0.42, 0.68] }
);

sections.forEach((section) => observer.observe(section));
