import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Github, ExternalLink, Play, ChevronLeft, ChevronRight } from "lucide-react";
import { projects } from "@/data/projects";

const ScreenshotGallery = ({ screenshots }: { screenshots: string[] }) => {
  const [active, setActive] = useState(0);
  const prev = () => setActive((i) => (i - 1 + screenshots.length) % screenshots.length);
  const next = () => setActive((i) => (i + 1) % screenshots.length);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-12"
    >
      {/* Main image */}
      <div className="relative rounded-lg overflow-hidden border border-border bg-secondary/40 mb-3">
        <div className="relative w-full" style={{ minHeight: "320px" }}>
          <AnimatePresence mode="wait">
            <motion.img
              key={active}
              src={screenshots[active]}
              alt={`Screenshot ${active + 1}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="media-untinted w-full h-full object-contain max-h-[520px]"
            />
          </AnimatePresence>
        </div>

        {/* Arrows */}
        <button
          onClick={prev}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/80 border border-border flex items-center justify-center hover:border-primary/50 hover:text-primary transition-colors backdrop-blur-sm"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          onClick={next}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/80 border border-border flex items-center justify-center hover:border-primary/50 hover:text-primary transition-colors backdrop-blur-sm"
        >
          <ChevronRight size={18} />
        </button>

        {/* Counter */}
        <div className="absolute bottom-3 right-3 bg-background/80 border border-border px-2.5 py-1 rounded text-xs font-mono text-muted-foreground backdrop-blur-sm">
          {active + 1} / {screenshots.length}
        </div>
      </div>

      {/* Thumbnails */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {screenshots.map((src, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`shrink-0 w-20 h-14 rounded overflow-hidden border transition-all ${
              i === active
                ? "border-primary ring-1 ring-primary/30"
                : "border-border opacity-50 hover:opacity-80"
            }`}
          >
            <img src={src} alt={`Thumb ${i + 1}`} className="media-untinted w-full h-full object-cover" />
          </button>
        ))}
      </div>
    </motion.div>
  );
};

const ProjectDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const project = projects.find((p) => p.slug === slug);

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold mb-4">Project Not Found</h1>
          <Link to="/#projects" className="text-primary hover:underline font-mono text-sm">
            ← Back to portfolio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background tech-grid">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border">
        <div className="max-w-6xl mx-auto px-6 md:px-12 flex items-center h-14">
          <Link
            to="/#projects"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Back to Portfolio</span>
          </Link>
        </div>
      </header>

      <main className="pt-28 pb-20 px-6 md:px-12">
        <div className="max-w-5xl mx-auto">
          {/* Media */}
          {project.video ? (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative rounded-lg overflow-hidden border border-border mb-12 aspect-video bg-black"
            >
              <video
                className="w-full h-full object-cover"
                src={project.video}
                poster={project.thumbnail}
                controls
                playsInline
                preload="metadata"
              />
            </motion.div>
          ) : project.screenshots?.length ? (
            <ScreenshotGallery screenshots={project.screenshots} />
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative rounded-lg overflow-hidden border border-border mb-12 group cursor-pointer aspect-video"
            >
              <img
                src={project.thumbnail}
                alt={`${project.title} preview`}
                className="media-untinted w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_28px_rgba(0,0,0,0.35)]">
                  <Play size={32} className="text-primary ml-1" />
                </div>
              </div>
              <div className="absolute bottom-4 left-4 bg-secondary/80 border border-border px-3 py-1 rounded text-xs font-mono text-muted-foreground">
                Demo video coming soon
              </div>
            </motion.div>
          )}

          {/* Project Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
              <div>
                <span className="text-xs font-mono text-muted-foreground mb-2 block">{project.date}</span>
                <h1 className="font-display text-4xl md:text-5xl font-bold mb-2">{project.title}</h1>
                <p className="text-lg text-muted-foreground max-w-2xl">{project.description}</p>
              </div>

              <div className="flex gap-3 shrink-0">
                {project.github && (
                  <a
                    href={project.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-secondary border border-border text-foreground px-4 py-2 rounded-md text-sm hover:border-primary/40 transition-colors"
                  >
                    <Github size={16} />
                    Source
                  </a>
                )}
                {project.live && (
                  <a
                    href={project.live}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm hover:opacity-90 transition-opacity"
                  >
                    <ExternalLink size={16} />
                    Live Demo
                  </a>
                )}
              </div>
            </div>

            {/* Glow divider */}
            <div className="glow-line mb-8" />

            {/* Tech Stack */}
            <div className="mb-10">
              <h2 className="font-mono text-sm text-primary tracking-wider mb-4">TECH STACK</h2>
              <div className="flex flex-wrap gap-2">
                {project.tech.map((t) => (
                  <span
                    key={t}
                    className="text-sm font-mono bg-primary/10 text-primary px-3 py-1.5 rounded border border-primary/20"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Details */}
            <div>
              <h2 className="font-mono text-sm text-primary tracking-wider mb-4">DETAILS</h2>
              <div className="glass-card rounded-lg p-6 md:p-8">
                <ul className="space-y-3">
                  {project.longDescription.map((item, i) => (
                    <li key={i} className="text-sm text-muted-foreground leading-relaxed flex gap-3">
                      <span className="text-primary mt-0.5 shrink-0 font-mono text-xs">▸</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default ProjectDetail;
