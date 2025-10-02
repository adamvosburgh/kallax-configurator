import { useEffect, useState } from 'react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AboutModal({ isOpen, onClose }: AboutModalProps) {
  const [exampleImages, setExampleImages] = useState<string[]>([]);

  useEffect(() => {
    // Load images from assets/example directory
    const loadImages = async () => {
      try {
        // Dynamically import all images from the example directory
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
    }
  }, [isOpen]);

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
        {/* Header bar similar to floating windows */}
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
          {/* Close button */}
          <button
            onClick={onClose}
            className="btn-icon"
            title="Close"
          >
            <span className="text-xs font-bold">×</span>
          </button>
        </div>

        {/* Content - scrollable */}
        <div className="p-8 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 60px)', backgroundColor: 'white'}}>

          <div className="space-y-6" style = {{margin: '1rem'}}>
            {/* Intro text */}
            <div className="text-mono text-sm leading-relaxed space-y-3">
              <p>
                Welcome to the Kallax Configurator - a tool for designing custom modular shelving units
                inspired by IKEA's iconic Kallax series. Create your own configuration with custom dimensions,
                materials, and options, then export detailed cut lists and IKEA-style assembly instructions.
              </p>
              <p>
                Whether you're building a bookshelf, media center, or room divider, this configurator helps
                you plan every detail with precision.
              </p>
            </div>

            {/* Image gallery */}
            {exampleImages.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold font-mono mb-4">Example Projects</h2>
                <div className="grid grid-cols-2 gap-4">
                  {exampleImages.map((src, index) => (
                    <div
                      key={index}
                      className="aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200"
                    >
                      <img
                        src={src}
                        alt={`Example ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Description text */}
            <div className="text-mono text-sm leading-relaxed space-y-3 pt-4">
              <h2 className="text-xl font-semibold font-mono mb-3">Features</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Interactive 3D preview with real-time updates</li>
                <li>Customizable grid layouts with merged compartments</li>
                <li>Precise material thickness controls</li>
                <li>Multiple door styles (inset or overlay)</li>
                <li>Automatic cut list generation</li>
                <li>IKEA-style PDF assembly instructions</li>
                <li>Design sharing via URL</li>
              </ul>

              <p className="pt-4">
                Built with React, Three.js, and TypeScript. Open source and free to use.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
