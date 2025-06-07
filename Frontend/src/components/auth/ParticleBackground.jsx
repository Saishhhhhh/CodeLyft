import { useState, useEffect, useRef } from 'react';

/**
 * A subtle, elegant background component with minimal animated elements
 * @param {Object} props - Component props
 * @param {string} [props.type="gradient"] - Background type: "gradient", "dots", "lines", or "minimal"
 * @param {string} [props.primaryColor="#6366F1"] - Primary color
 * @param {string} [props.secondaryColor="#EC4899"] - Secondary color
 * @param {number} [props.density=15] - Density of elements (lower = more subtle)
 */
const ParticleBackground = ({
  type = "gradient",
  primaryColor = "#6366F1",
  secondaryColor = "#EC4899",
  density = 15
}) => {
  const canvasRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const animationRef = useRef(null);
  
  // Set up canvas dimensions
  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    
    return () => {
      window.removeEventListener('resize', updateDimensions);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);
  
  // Draw background based on type
  useEffect(() => {
    if (!canvasRef.current || dimensions.width === 0) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas dimensions
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Create gradient background
    const createGradient = () => {
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, primaryColor + '10'); // Very transparent
      gradient.addColorStop(1, secondaryColor + '10'); // Very transparent
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };
    
    // Initialize elements based on type
    let elements = [];
    const elementCount = Math.floor((dimensions.width * dimensions.height) / (20000 / density));
    
    switch (type) {
      case "dots":
        createGradient();
        
        // Create subtle dots
        for (let i = 0; i < elementCount; i++) {
          elements.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: Math.random() * 1.5 + 0.5, // Small dots
            opacity: Math.random() * 0.07 + 0.03, // Very subtle opacity
            color: Math.random() > 0.5 ? primaryColor : secondaryColor,
            speed: Math.random() * 0.2 + 0.1
          });
        }
        break;
        
      case "lines":
        createGradient();
        
        // Create subtle lines
        for (let i = 0; i < elementCount / 3; i++) {
          elements.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            length: Math.random() * 100 + 50,
            width: Math.random() * 0.5 + 0.1, // Very thin lines
            angle: Math.random() * Math.PI * 2,
            opacity: Math.random() * 0.05 + 0.02, // Very subtle opacity
            color: Math.random() > 0.5 ? primaryColor : secondaryColor,
            speed: Math.random() * 0.1 + 0.05
          });
        }
        break;
        
      case "minimal":
        createGradient();
        
        // Create just a few subtle elements
        for (let i = 0; i < 5; i++) {
          const size = Math.random() * 200 + 100;
          elements.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: size,
            opacity: Math.random() * 0.03 + 0.01, // Extremely subtle
            color: Math.random() > 0.5 ? primaryColor : secondaryColor,
            speed: Math.random() * 0.05 + 0.02
          });
        }
        break;
        
      case "gradient":
      default:
        // Create animated gradient
        elements = [{
          angle: 0,
          speed: 0.001
        }];
        break;
    }
    
    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      switch (type) {
        case "dots":
          createGradient();
          
          // Draw and update dots
          elements.forEach(dot => {
            ctx.beginPath();
            ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
            ctx.fillStyle = dot.color + Math.floor(dot.opacity * 255).toString(16).padStart(2, '0');
            ctx.fill();
            
            // Move dots upward slowly
            dot.y -= dot.speed;
            
            // Reset position if off screen
            if (dot.y < -10) {
              dot.y = canvas.height + 10;
              dot.x = Math.random() * canvas.width;
            }
          });
          break;
          
        case "lines":
          createGradient();
          
          // Draw and update lines
          elements.forEach(line => {
            ctx.beginPath();
            ctx.moveTo(line.x, line.y);
            ctx.lineTo(
              line.x + Math.cos(line.angle) * line.length,
              line.y + Math.sin(line.angle) * line.length
            );
            ctx.strokeStyle = line.color + Math.floor(line.opacity * 255).toString(16).padStart(2, '0');
            ctx.lineWidth = line.width;
            ctx.stroke();
            
            // Slowly drift
            line.x += Math.cos(line.angle + Math.PI/2) * line.speed;
            line.y += Math.sin(line.angle + Math.PI/2) * line.speed;
            
            // Reset position if off screen
            if (line.x < -line.length || line.x > canvas.width + line.length || 
                line.y < -line.length || line.y > canvas.height + line.length) {
              line.x = Math.random() * canvas.width;
              line.y = Math.random() * canvas.height;
            }
          });
          break;
          
        case "minimal":
          createGradient();
          
          // Draw and update minimal shapes
          elements.forEach(shape => {
            ctx.beginPath();
            ctx.arc(shape.x, shape.y, shape.size, 0, Math.PI * 2);
            const gradient = ctx.createRadialGradient(
              shape.x, shape.y, 0, 
              shape.x, shape.y, shape.size
            );
            gradient.addColorStop(0, shape.color + Math.floor(shape.opacity * 255).toString(16).padStart(2, '0'));
            gradient.addColorStop(1, shape.color + '00'); // Transparent
            ctx.fillStyle = gradient;
            ctx.fill();
            
            // Very slow drift
            shape.x += Math.cos(Date.now() * 0.0001) * shape.speed;
            shape.y += Math.sin(Date.now() * 0.0001) * shape.speed;
            
            // Keep on screen
            shape.x = Math.max(-shape.size/2, Math.min(canvas.width + shape.size/2, shape.x));
            shape.y = Math.max(-shape.size/2, Math.min(canvas.height + shape.size/2, shape.y));
          });
          break;
          
        case "gradient":
        default:
          // Animated gradient
          const element = elements[0];
          element.angle += element.speed;
          
          const gradient = ctx.createLinearGradient(
            canvas.width/2 + Math.cos(element.angle) * canvas.width,
            canvas.height/2 + Math.sin(element.angle) * canvas.height,
            canvas.width/2 + Math.cos(element.angle + Math.PI) * canvas.width,
            canvas.height/2 + Math.sin(element.angle + Math.PI) * canvas.height
          );
          
          gradient.addColorStop(0, primaryColor + '10');
          gradient.addColorStop(0.5, secondaryColor + '08');
          gradient.addColorStop(1, primaryColor + '10');
          
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          break;
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [dimensions, type, primaryColor, secondaryColor, density]);
  
  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 -z-10"
      style={{ 
        width: '100%', 
        height: '100%',
        opacity: 0.8
      }}
    />
  );
};

export default ParticleBackground;