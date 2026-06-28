import { motion } from "framer-motion";
import { ExternalLink, Github, Play } from "lucide-react";
import { Link } from "react-router-dom";
import { projects } from "@/data/projects";

const ProjectsSection = () => {
  return (
    <section id="projects" className="section-padding tech-grid">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <p className="text-primary font-mono font-medium tracking-widest uppercase text-xs mb-3">Projects</p>
          <h2 className="font-display text-3xl md:text-5xl font-bold">Things I've <span className="text-gradient">Built</span></h2>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project, i) => (
            <motion.div
              key={project.slug}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-card rounded-lg overflow-hidden flex flex-col group transition-colors"
            >
              {/* Video Thumbnail */}
              <Link to={`/project/${project.slug}`} className="relative aspect-video overflow-hidden cursor-pointer">
                <img
                  src={project.thumbnail}
                  alt={`${project.title} preview`}
                  className="media-untinted w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-primary/20 border border-primary flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_24px_rgba(0,0,0,0.35)]">
                    <Play size={20} className="text-primary ml-0.5" />
                  </div>
                </div>
              </Link>

              <div className="p-6 flex flex-col flex-1">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono text-muted-foreground">{project.date}</span>
                  <div className="flex gap-3">
                    {project.github && (
                      <a href={project.github} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                        <Github size={16} />
                      </a>
                    )}
                    {project.live && (
                      <a href={project.live} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                        <ExternalLink size={16} />
                      </a>
                    )}
                  </div>
                </div>

                <Link to={`/project/${project.slug}`}>
                  <h3 className="font-display text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                    {project.title}
                  </h3>
                </Link>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5 flex-1">
                  {project.description}
                </p>

                <div className="flex flex-wrap gap-2">
                  {project.tech.slice(0, 4).map((t) => (
                    <span key={t} className="text-xs font-mono bg-primary/10 text-primary px-2.5 py-1 rounded border border-primary/20">
                      {t}
                    </span>
                  ))}
                  {project.tech.length > 4 && (
                    <span className="text-xs font-mono text-muted-foreground px-2.5 py-1">
                      +{project.tech.length - 4}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProjectsSection;
