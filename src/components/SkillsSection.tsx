import { motion } from "framer-motion";

const skillCategories = [
  {
    title: "Languages",
    skills: ["Java", "Python", "JavaScript", "TypeScript", "R", "SQL", "HTML", "CSS"],
  },
  {
    title: "Frameworks & Libraries",
    skills: ["React", "Node.js", "Express.js", "Flask", "FastAPI", "Pandas", "NumPy", "scikit-learn", "Pygame", "Dash", "Plotly", "Matplotlib"],
  },
  {
    title: "Tools & Platforms",
    skills: ["Git/GitHub", "Docker", "Postman", "MongoDB", "MySQL", "Microsoft Azure", "Figma", "R Studio", "Excel"],
  },
];

const SkillsSection = () => {
  return (
    <section id="skills" className="section-padding">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <p className="text-primary font-mono font-medium tracking-widest uppercase text-xs mb-3">Skills</p>
          <h2 className="font-display text-3xl md:text-5xl font-bold">Technical <span className="text-gradient">Toolkit</span></h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-4">
          {skillCategories.map((category, i) => (
            <motion.div
              key={category.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="glass-card rounded-lg p-8 transition-colors"
            >
              <h3 className="font-mono text-sm font-semibold mb-5 text-primary tracking-wider">{category.title.toUpperCase()}</h3>
              <div className="flex flex-wrap gap-2">
                {category.skills.map((skill) => (
                  <span
                    key={skill}
                    className="text-sm font-mono bg-secondary text-foreground px-3 py-1.5 rounded border border-border hover:border-primary/40 transition-colors"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SkillsSection;
