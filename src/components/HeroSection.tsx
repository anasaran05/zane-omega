import { useEffect, useRef } from "react";
import gsap from "gsap";

const HeroSection = () => {
  const headingRef = useRef<HTMLHeadingElement | null>(null);

  useEffect(() => {
    if (headingRef.current) {
      gsap.from(headingRef.current, {
        y: 80,
        opacity: 0,
        duration: 1.2,
        ease: "power3.out",
      });
    }
  }, []);

  return (
    <section className="hero">
      <h1 ref={headingRef} data-aos="fade-up">
        Welcome to LearnFlow ✨
      </h1>
      <p data-aos="fade-up" data-aos-delay="300">
        Animate anything with GSAP, AOS, and smooth scrolling.
      </p>
    </section>
  );
};

export default HeroSection;
