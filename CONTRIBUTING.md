# Contributing to BrewHub

Grazie per il tuo interesse nel contribuire a BrewHub! 🎉

## 📋 Indice

- [Development Workflow](#development-workflow)
- [Branch Naming](#branch-naming)
- [Commit Messages](#commit-messages)
- [Code Style](#code-style)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)

## 🔄 Development Workflow

### 1. Setup Ambiente

```bash
# Fork e clone del repository
git clone <your-fork-url>
cd Agile_25

# Aggiungi upstream remote
git remote add upstream <original-repo-url>

# Installa dipendenze
cd BrewHub_Web/backend && npm install
cd ../frontend && npm install
```

### 2. Crea Feature Branch

```bash
# Aggiorna main
git checkout main
git pull upstream main

# Crea nuovo branch
git checkout -b feature/nome-feature
```

### 3. Sviluppa

- Scrivi codice pulito e ben documentato
- Aggiungi test per nuove funzionalità
- Mantieni commit atomici e significativi

### 4. Test

```bash
# Backend
cd BrewHub_Web/backend
npm test
npm run lint

# Frontend
cd BrewHub_Web/frontend
npm test
npm run lint
```

### 5. Push e Pull Request

```bash
git push origin feature/nome-feature
```

Apri Pull Request su GitHub verso `main`.

## 🌿 Branch Naming

Usa prefissi descrittivi:

- `feature/` - Nuove funzionalità
  - `feature/user-authentication`
  - `feature/post-comments`

- `bugfix/` - Fix di bug
  - `bugfix/login-error`
  - `bugfix/image-upload`

- `hotfix/` - Fix urgenti in produzione
  - `hotfix/security-patch`

- `refactor/` - Refactoring codice
  - `refactor/backend-structure`

- `docs/` - Solo documentazione
  - `docs/api-documentation`

## 💬 Commit Messages

Segui [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: Nuova funzionalità
- `fix`: Bug fix
- `docs`: Documentazione
- `style`: Formattazione
- `refactor`: Refactoring
- `test`: Test
- `chore`: Manutenzione

### Esempi

```bash
feat(auth): add password reset functionality

Implemented password reset flow using Firebase Auth.
Users can now request password reset via email.

Closes #123
```

```bash
fix(posts): resolve image upload error

Fixed issue where images larger than 5MB failed to upload.
Added file size validation before upload.
```

## 🎨 Code Style

### JavaScript/React

- Usa **ESLint** configuration del progetto
- Segui [Airbnb Style Guide](https://github.com/airbnb/javascript)
- Usa **Prettier** per formattazione automatica

```bash
# Lint
npm run lint

# Fix automatico
npm run lint -- --fix
```

### Best Practices

#### Backend

```javascript
// ✅ Good
const getUserById = async (userId) => {
  try {
    const user = await db.collection('users').doc(userId).get();
    if (!user.exists) {
      throw new Error('User not found');
    }
    return user.data();
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
};

// ❌ Bad
const getUser = (id) => {
  return db.collection('users').doc(id).get().then(u => u.data());
};
```

#### Frontend

```javascript
// ✅ Good
const PostCard = ({ post, onVote }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <div className="post-card">
      {/* ... */}
    </div>
  );
};

// ❌ Bad
function PostCard(props) {
  var expanded = false;
  return <div>{/* ... */}</div>;
}
```

### Naming Conventions

- **Components**: PascalCase (`PostCard`, `UserProfile`)
- **Functions**: camelCase (`getUserPosts`, `handleSubmit`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`, `MAX_FILE_SIZE`)
- **Files**: kebab-case (`post-service.js`, `user-controller.js`)

## 🧪 Testing

### Coverage Requirements

- **Minimum**: 70% coverage
- **Target**: 80%+ coverage
- **Critical paths**: 100% coverage

### Test Structure

```javascript
describe('PostController', () => {
  describe('createPost', () => {
    it('should create post with valid data', async () => {
      // Arrange
      const postData = { text: 'Test post', uid: 'user123' };
      
      // Act
      const result = await createPost(postData);
      
      // Assert
      expect(result).toHaveProperty('id');
      expect(result.text).toBe('Test post');
    });

    it('should throw error with invalid data', async () => {
      // Arrange
      const invalidData = { text: '' };
      
      // Act & Assert
      await expect(createPost(invalidData)).rejects.toThrow();
    });
  });
});
```

### Run Tests Before PR

```bash
# Backend
cd BrewHub_Web/backend
npm test -- --coverage
npm run lint

# Frontend
cd BrewHub_Web/frontend
npm test -- --coverage --watchAll=false
npm run lint
```

## 🔍 Pull Request Process

### 1. Checklist Pre-PR

- [ ] Codice funziona localmente
- [ ] Tutti i test passano
- [ ] Coverage >= 70%
- [ ] Nessun warning ESLint
- [ ] Documentazione aggiornata
- [ ] Commit messages seguono convenzioni

### 2. PR Template

```markdown
## Description
Breve descrizione delle modifiche

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
Descrivi come hai testato le modifiche

## Screenshots (se applicabile)
Aggiungi screenshot per modifiche UI

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] All tests passing
```

### 3. Code Review

- Rispondi ai commenti in modo costruttivo
- Richiedi chiarimenti se necessario
- Aggiorna il codice in base al feedback
- Risolvi tutti i commenti prima del merge

### 4. Merge

- Squash commits se necessario
- Assicurati che CI/CD passi
- Merge solo dopo approvazione

## 🐛 Reporting Bugs

Usa [GitHub Issues](https://github.com/.../issues) con template:

```markdown
**Describe the bug**
Chiara descrizione del bug

**To Reproduce**
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
Cosa ti aspettavi che succedesse

**Screenshots**
Se applicabile

**Environment**
- OS: [e.g. macOS]
- Browser: [e.g. Chrome 120]
- Version: [e.g. 1.0.0]
```

## 💡 Feature Requests

Usa [GitHub Issues](https://github.com/.../issues) con label `enhancement`:

```markdown
**Is your feature request related to a problem?**
Descrizione del problema

**Describe the solution**
Come vorresti risolvere il problema

**Describe alternatives**
Alternative considerate

**Additional context**
Altro contesto utile
```

## 📞 Getting Help

- **Slack**: #brewhub-dev
- **Email**: team@brewhub.dev
- **GitHub Discussions**: Per domande generali

## 🙏 Thank You!

Ogni contributo è prezioso. Grazie per aiutarci a migliorare BrewHub! ☕
