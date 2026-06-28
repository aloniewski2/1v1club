import { motion } from "framer-motion";
import { Briefcase } from "lucide-react";

const experiences = [
  {
    company: "Noteefy",
    role: "Software Engineering Intern",
    period: "June 2025 – Present",
    location: "Remote",
    bullets: [
      "Developed and enhanced Waitlist and Confirm features — core tools in Noteefy's automated tee-time platform used by 800+ golf courses.",
      "Built functionality with React frontend connected to Python/JavaScript backend with MongoDB and Docker.",
      "Onboarded 100+ golf courses, saving ~150+ engineering hours and generating over $1.3M in revenue.",
      "Diagnosed and resolved client-reported issues through cross-functional collaboration with Customer Success.",
      "Used Postman to design, test, and debug APIs for smooth data flow between UI and backend.",
    ],
  },
  {
    company: "Muhlenberg Student Managed Investment Fund",
    role: "Quantitative Researcher",
    period: "September 2023 – Present",
    location: "Allentown, PA",
    bullets: [
      "Key member of a 34-person quant team — 27% return (2022), 25% return (2023), $418K cumulative P&L from $600K base.",
      "Designed forecasting models, analytical programs, and data pipelines for data-driven trading decisions.",
      "Studied Bayesian statistics, machine learning, deep learning, option pricing, and mean reversion.",
    ],
  },
  {
    company: "Finsiders",
    role: "Digital Platforms Intern",
    period: "March 2024 – May 2024",
    location: "Remote",
    bullets: [
      "Developed and relaunched Finsiders.org — a nonprofit connecting banking, design, and tech professionals.",
      "Led the full development process from concept to deployment, overseeing design, UX, and functionality.",
      "Facilitated team meetings to align goals, gather feedback, and drive continuous improvements.",
    ],
  },
];

const ExperienceSection = () => {
  return (
    <section id="experience" className="section-padding">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <p className="text-primary font-mono font-medium tracking-widest uppercase text-xs mb-3">Experience</p>
          <h2 className="font-display text-3xl md:text-5xl font-bold">Where I've <span className="text-gradient">Worked</span></h2>
        </motion.div>

        <div className="relative">
          <div className="absolute left-4 md:left-6 top-0 bottom-0 w-px bg-primary/20" />

          <div className="flex flex-col gap-10">
            {experiences.map((exp, i) => (
              <motion.div
                key={exp.company}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative pl-14 md:pl-20"
              >
                <div className="absolute left-2 md:left-4 top-1 w-5 h-5 rounded-sm bg-primary/20 border border-primary flex items-center justify-center">
                  <Briefcase size={10} className="text-primary" />
                </div>

                <div className="glass-card rounded-lg p-6 md:p-8 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-3 gap-1">
                    <h3 className="font-display text-lg font-semibold">{exp.company}</h3>
                    <span className="text-xs font-mono text-muted-foreground">{exp.period} · {exp.location}</span>
                  </div>
                  <p className="text-primary text-sm font-mono font-medium mb-4">{exp.role}</p>
                  <ul className="space-y-2">
                    {exp.bullets.map((bullet, j) => (
                      <li key={j} className="text-sm text-muted-foreground leading-relaxed flex gap-2">
                        <span className="text-primary mt-1 shrink-0 font-mono text-xs">▸</span>
                        {bullet}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ExperienceSection;
