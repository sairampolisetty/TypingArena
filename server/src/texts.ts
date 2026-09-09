// Typing passages for TypingArena
// Organized by difficulty: easy, medium, hard
// All characters sanitized to standard ASCII for smooth keyboard typing

export interface TextPassage {
  id: string;
  text: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export const passages: TextPassage[] = [
  // EASY passages - simple words, minimal punctuation
  {
    id: 'e1',
    category: 'General',
    difficulty: 'easy',
    text: 'The sun rises every morning and brings light to the world. People wake up and start their day with hope and energy. A good morning routine can set the tone for the entire day ahead of you.'
  },
  {
    id: 'e2',
    category: 'Nature',
    difficulty: 'easy',
    text: 'Trees grow tall and strong over many years. Their roots dig deep into the ground to find water. Birds build nests in the branches and sing songs at dawn. Nature has a rhythm that never stops and never tires.'
  },
  {
    id: 'e3',
    category: 'Education',
    difficulty: 'easy',
    text: 'Learning new things every day makes us smarter and more capable. Reading books helps us understand the world from different points of view. Good habits formed early in life tend to last a very long time.'
  },
  {
    id: 'e4',
    category: 'Productivity',
    difficulty: 'easy',
    text: 'Small steps taken every day lead to great results over time. Focus on one task at a time and do it well before moving on. A clean workspace helps you think more clearly and work more efficiently.'
  },

  // MEDIUM passages - mixed sentence lengths, standard punctuation
  {
    id: 'm1',
    category: 'Technology',
    difficulty: 'medium',
    text: 'The internet has transformed how we communicate, learn, and work. Within seconds, you can connect with someone on the other side of the world. This extraordinary power comes with responsibility - we must use it thoughtfully, carefully, and with respect for others.'
  },
  {
    id: 'm2',
    category: 'Space',
    difficulty: 'medium',
    text: "Astronomers have discovered thousands of exoplanets orbiting distant stars. Some of these worlds may harbor conditions suitable for life as we know it. The search for extraterrestrial intelligence remains one of humanity's most profound and enduring scientific quests."
  },
  {
    id: 'm3',
    category: 'Science',
    difficulty: 'medium',
    text: 'Climate change poses one of the greatest challenges of our generation. Rising temperatures, shifting weather patterns, and melting ice caps demand urgent global action. Scientists, engineers, and policymakers must collaborate to develop sustainable solutions for a livable future.'
  },
  {
    id: 'm4',
    category: 'Business',
    difficulty: 'medium',
    text: 'Great companies are built on clear values, strong culture, and a genuine commitment to serving their customers. Innovation requires the courage to experiment, fail, learn, and iterate. The most successful leaders listen more than they speak and empower their teams to do meaningful work.'
  },
  {
    id: 'm5',
    category: 'General',
    difficulty: 'medium',
    text: 'Creativity is not a talent reserved for artists and musicians - it is a fundamental human capacity. Every problem you solve, every decision you make, and every idea you communicate draws on creative thinking. Nurturing curiosity, embracing failure, and staying open to surprise are the hallmarks of a creative mind.'
  },

  // HARD passages - complex punctuation, numbers, technical terms
  {
    id: 'h1',
    category: 'Programming',
    difficulty: 'hard',
    text: "In object-oriented programming, encapsulation ensures that an object's internal state is protected from unauthorized modification. By exposing only well-defined interfaces (e.g., public methods), developers can safely refactor implementations without breaking dependent code. This principle forms the foundation of robust, maintainable software architecture."
  },
  {
    id: 'h2',
    category: 'Technology',
    difficulty: 'hard',
    text: 'Modern distributed systems face fundamental trade-offs described by the CAP theorem: Consistency, Availability, and Partition Tolerance. No system can fully guarantee all three simultaneously. Engineers must carefully analyze their requirements before selecting the appropriate database architecture and replication strategy.'
  },
  {
    id: 'h3',
    category: 'Science',
    difficulty: 'hard',
    text: 'Quantum entanglement describes a phenomenon where two particles become correlated in such a way that the quantum state of each particle cannot be described independently. Measuring one particle instantaneously affects the state of its partner, regardless of the distance separating them.'
  },
  {
    id: 'h4',
    category: 'Space',
    difficulty: 'hard',
    text: 'The James Webb Space Telescope (JWST), launched on December 25, 2021, operates at a distance of approximately 1.5 million km from Earth at the L2 Lagrange point. With its 6.5-meter primary mirror and near-infrared sensitivity, JWST can observe galaxies formed just 200-300 million years after the Big Bang.'
  }
];

export function getRandomText(difficulty: 'easy' | 'medium' | 'hard'): string {
  const filtered = passages.filter(p => p.difficulty === difficulty);
  if (filtered.length === 0) return passages[Math.floor(Math.random() * passages.length)].text;
  return filtered[Math.floor(Math.random() * filtered.length)].text;
}
