import HomeAppShortcut from './HomeAppShortcut';

interface Props {
  shouldAnimateUnlock?: boolean;
}

const Dock = ({ shouldAnimateUnlock = false }: Props) => {
  const colors = [
    { color: '#a6a6a6', id: 'dom', icon: 'safari' },
    { color: '#abc526', id: 'js', icon: 'apple-music' },
    { color: '#37a97b', id: 'ts', icon: 'ios-message' },
    { color: '#0018bb', id: 'swift', icon: 'mail' },
  ];
  return (
    <div 
      className='iphone-dock mt-auto grid grid-cols-4 gap-7 gap-y-5 p-4 m-4 bg-zinc-300/30 backdrop-blur-md'
      style={{
        borderRadius: '30px',
        // 1px wider background - subtle but effective
        backgroundImage: 'linear-gradient(rgba(161, 161, 170, 0.3), rgba(161, 161, 170, 0.3))',
        backgroundSize: 'calc(100% + 2px) calc(100% + 2px)',
        backgroundPosition: 'center',
      }}
    >
      {colors.map((app, index) => (
        <HomeAppShortcut 
          key={app.id} 
          appId={app.id} 
          icon={app.icon} 
          shouldAnimateUnlock={shouldAnimateUnlock}
          animationIndex={index} // Sync with main apps timing
        />
      ))}
    </div>
  );
};

export default Dock;
