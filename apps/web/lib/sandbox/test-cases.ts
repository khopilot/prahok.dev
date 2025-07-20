/**
 * Cas de test pour valider la polyvalence du système
 * Ces prompts démontrent différents types d'applications
 */

export const testCases = [
  {
    id: 'tic-tac-toe',
    name: 'Jeu Tic-Tac-Toe',
    prompt: `Create a beautiful Tic-Tac-Toe game with:
- Modern dark theme design
- Smooth animations
- Score tracking
- Reset button
- Responsive layout
- Winner celebration animation
Make it look premium and polished.`,
    category: 'games'
  },
  {
    id: 'connect4',
    name: 'Jeu Connect 4',
    prompt: `Build a Connect 4 game with:
- Two player mode
- Animated disc dropping
- Winner detection
- Beautiful gradient design
- Sound effects (optional)
- Mobile responsive
Use Tailwind CSS for styling.`,
    category: 'games'
  },
  {
    id: 'markdown-blog',
    name: 'Blog avec Markdown',
    prompt: `Create a blog with Markdown support and dark theme:
- Homepage with article list
- Individual article pages
- Markdown rendering with syntax highlighting
- Dark/light theme toggle
- Search functionality
- Categories and tags
- Beautiful typography
- Mobile responsive design`,
    category: 'content'
  },
  {
    id: 'banana-landing',
    name: 'Landing Page Entreprise de Bananes',
    prompt: `Design a landing page for a banana company:
- Hero section with catchy tagline
- Product showcase with different banana types
- Company story section
- Customer testimonials
- Contact form
- Newsletter signup
- Use yellow/green color scheme
- Add fun banana animations
- Make it playful but professional`,
    category: 'business'
  },
  {
    id: 'image-resizer',
    name: 'Outil de Redimensionnement d\'Images',
    prompt: `Build an image resizing tool that allows:
- Upload images via drag & drop
- Resize by percentage or pixels
- Add borders with customizable:
  - Border thickness
  - Border color picker
  - Rounded corners radius
- Preview before/after
- Download resized image
- Support multiple formats (jpg, png, webp)
- Beautiful UI with smooth interactions`,
    category: 'tools'
  },
  {
    id: 'personal-linktree',
    name: 'Link Tree Personnel',
    prompt: `Create a personal link tree page:
- Profile photo and bio
- Social media links with icons
- Custom link buttons
- Analytics tracking (mock)
- Theme customization
- Animated background
- Mobile optimized
- Share functionality
Make it unique and visually appealing`,
    category: 'personal'
  },
  {
    id: 'khmer-dictionary',
    name: 'Dictionnaire Khmer',
    prompt: `បង្កើត website វចនានុក្រមភាសាខ្មែរ:
- ទំព័រស្វែងរកពាក្យ
- បង្ហាញអត្ថន័យជាភាសាខ្មែរ និងអង់គ្លេស
- ឧទាហរណ៍ប្រើប្រាស់
- សំឡេងអាន (mock)
- ប្រវត្តិស្វែងរក
- ពាក្យពេញនិយម
- រចនាសម្ព័ន្ធស្អាត
សរសេរ comment ជាភាសាខ្មែរ`,
    category: 'education'
  },
  {
    id: 'recipe-app',
    name: 'Application de Recettes',
    prompt: `Create a recipe application:
- Recipe cards with images
- Ingredients list
- Step-by-step instructions
- Cooking time and difficulty
- Search and filter
- Favorite recipes
- Shopping list generator
- Print-friendly view
Focus on beautiful food photography layout`,
    category: 'lifestyle'
  }
];

// Fonction pour obtenir un cas de test aléatoire
export function getRandomTestCase() {
  return testCases[Math.floor(Math.random() * testCases.length)];
}

// Fonction pour obtenir des cas de test par catégorie
export function getTestCasesByCategory(category: string) {
  return testCases.filter(tc => tc.category === category);
}

// Export des catégories disponibles
export const categories = Array.from(new Set(testCases.map(tc => tc.category)));