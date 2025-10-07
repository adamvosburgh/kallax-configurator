import { useEffect, useState } from 'react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AboutModal({ isOpen, onClose }: AboutModalProps) {
  const [exampleImages, setExampleImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const loadImages = async () => {
      try {
        const imageModules = import.meta.glob('/src/assets/example/*.(png|jpg|jpeg|gif|webp)');
        const imagePaths = await Promise.all(
          Object.keys(imageModules).map(async (path) => {
            const mod = await imageModules[path]() as { default: string };
            return mod.default;
          })
        );
        setExampleImages(imagePaths);
      } catch (error) {
        console.error('Failed to load example images:', error);
      }
    };

    if (isOpen) {
      loadImages();
      setCurrentImageIndex(0);
    }
  }, [isOpen]);

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? exampleImages.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === exampleImages.length - 1 ? 0 : prev + 1));
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-[9998]"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg shadow-xl z-[9999] w-[90vw] max-w-[800px] max-h-[85vh] overflow-hidden"
        style={{
          backgroundColor: '#fafafa',
          border: '1px solid #e5e7eb',
          borderRadius: '1rem'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            backgroundColor: '#fafafa',
            borderBottom: '1px solid #e5e7eb',
            padding: '0.75rem 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <h1 className="text-lg font-semibold font-mono" style={{ margin: 0 }}>About</h1>
          <button onClick={onClose} className="btn-icon" title="Close">
            <span className="text-xs font-bold">×</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 60px)', backgroundColor: 'white' }}>
          <div className="space-y-6" style={{ margin: '1rem' }}>
            <div className="text-mono text-sm leading-relaxed space-y-3">

              <h1>The Kallax Configurator</h1>
              <p>Design your own modular shelving system – inspired by IKEA’s Kallax, but made for DIYers.</p>

              <h2>How to Use</h2>
              <p>Design your dream shelving: set the size of your grid, merge cells, add backs or doors, and adjust depth as you like. Watch for warnings: this tool doesn’t prevent bad design. It’s *completely possible* to make a structurally unstable unit here – so please pay attention to messages and remember: 3/4" plywood is heavy. Need help with strength? Try the excellent Sagulator to estimate shelf deflection. Collaborate: use “Share design link” to send a saved configuration to someone else. Build it: generate a PDF when you’re ready – it’ll create an IKEA-style assembly guide (with caveats and best practices noted inside).</p>

              <h2>Background</h2>
              <p>I built this tool after moving into a new apartment and needing storage – entry cabinets, media consoles, nightstands, a mix of open and closed shelving. I wanted to upgrade from my previous IKEA pieces – mainly in material – while keeping their functionality, modularity, and affordability. The Kallax system turned out to be the perfect starting point. I recreated its internal module using plywood, built 13 custom pieces for my space, and refined a repeatable, cohesive design logic along the way. Images of those pieces are below.</p>

              {/* Image gallery */}
              {exampleImages.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold font-mono mb-4">Examples</h2>
                  <div style={{ position: 'relative', aspectRatio: '16/9', backgroundColor: '#f3f4f6', borderRadius: '0.5rem' }}>
                    <img
                      src={exampleImages[currentImageIndex]}
                      alt={`Example ${currentImageIndex + 1} of ${exampleImages.length}`}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />

                    {/* Previous button - LEFT SIDE */}
                    {exampleImages.length > 1 && (
                      <button
                        onClick={handlePrevImage}
                        style={{
                          position: 'absolute',
                          left: '8px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          backgroundColor: 'rgba(255, 255, 255, 0.8)',
                          border: 'none',
                          borderRadius: '50%',
                          width: '40px',
                          height: '40px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          zIndex: 10,
                        }}
                        title="Previous image"
                      >
                        <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#374151' }}>‹</span>
                      </button>
                    )}

                    {/* Next button - RIGHT SIDE */}
                    {exampleImages.length > 1 && (
                      <button
                        onClick={handleNextImage}
                        style={{
                          position: 'absolute',
                          right: '8px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          backgroundColor: 'rgba(255, 255, 255, 0.8)',
                          border: 'none',
                          borderRadius: '50%',
                          width: '40px',
                          height: '40px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          zIndex: 10,
                        }}
                        title="Next image"
                      >
                        <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#374151' }}>›</span>
                      </button>
                    )}

                    {/* Image counter */}
                    {exampleImages.length > 1 && (
                      <div style={{
                        position: 'absolute',
                        bottom: '8px',
                        right: '8px',
                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                        color: 'white',
                        fontSize: '0.75rem',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.25rem',
                        fontFamily: 'monospace',
                      }}>
                        {currentImageIndex + 1} / {exampleImages.length}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <h2>The Configurator</h2>
              <p>In Rhino, I developed a flexible block system that could scale from one piece to many. Afterwards, I turned that into this web app – a way to share the design logic of furniture construction while preserving the Kallax’s interior module. This tool lets you make plywood furniture that’s *compatible with IKEA Kallax accessories*, merge or resize modules (taller, wider, deeper, shallower), and customize doors, backs, and proportions. For reference: all my own builds are 16" deep (to match what I planned to place on top) and use 1/2" doors – which work fine structurally, but are too shallow for a standard Euro hinge. I made this for fun and hope others find it useful. If you make something with it, please share! You can reach me by email with builds, issues, or suggestions – I’ll do my best to reply.</p>

              <h2>Open Source</h2>
              <p>This project is released under the MIT License, which means you can use, modify, and distribute it freely, provided you include the original license and copyright notice. If you’d like to contribute, feel free to fork the repo, create a feature branch, and submit a pull request.</p>

              <h2>Contact</h2>
              <p>Feel free to reach out to share what you make, for questions, for ideas, to adam vosburgh (at) gmail (dot) com.</p>

              <h2>A Note to IKEA</h2>
              <p>Dear IKEA corporate lawyer, please don’t send me a cease and desist. I’m not using your branding, assets, or IP. This project is *pro-IKEA* – the Kallax is a great shelving system. It doesn’t compete with IKEA products; DIYers are a different audience entirely. In fact, it probably encourages people to buy your accessories. Honestly, you should be paying me.</p>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}
