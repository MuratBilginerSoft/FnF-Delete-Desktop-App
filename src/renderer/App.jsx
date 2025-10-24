import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import ProfileSelection from './components/ProfileSelection';
import MainApp from './components/MainApp';
import useProfileStore from './store/useProfileStore';
import './styles/App.css';

function App() {
  const { currentProfile } = useProfileStore();

  const handleProfileSelected = (profile) => {
    // Profile is already set in the store by ProfileSelection component
  };

  const handleLogout = () => {
    // Profile is already cleared in the store by MainApp component
  };

  return (
    <ThemeProvider>
      <LanguageProvider>
        {!currentProfile ? (
          <ProfileSelection onProfileSelected={handleProfileSelected} />
        ) : (
          <MainApp onLogout={handleLogout} />
        )}
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
