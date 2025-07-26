'use client';

import React, {
  FC,
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { AnimatePresence, motion, useAnimation } from 'framer-motion';
import { useDispatch } from 'react-redux';

import { interfaceActions } from '@/store/interface-slice';

// Isolated PasscodeKeypad component - completely separate from parent state
const PasscodeKeypad = React.memo(function PasscodeKeypad({
  passcode,
  isShaking,
  onPasscodeInput,
  onDelete,
  onCancel,
}: {
  passcode: string;
  isShaking: boolean;
  // eslint-disable-next-line no-unused-vars
  onPasscodeInput: (_digit: string) => void;
  onDelete: () => void;
  onCancel: () => void;
}) {
  // Stable keypad data that never changes
  const keypadData = useMemo(
    () => [
      { digit: '1', letters: '' },
      { digit: '2', letters: 'ABC' },
      { digit: '3', letters: 'DEF' },
      { digit: '4', letters: 'GHI' },
      { digit: '5', letters: 'JKL' },
      { digit: '6', letters: 'MNO' },
      { digit: '7', letters: 'PQRS' },
      { digit: '8', letters: 'TUV' },
      { digit: '9', letters: 'WXYZ' },
    ],
    []
  );

  return (
    <motion.div
      className='absolute inset-0 flex flex-col justify-center px-6'
      style={{
        // CRITICAL: No background - use iPhone shell's unified background
        background: 'none',
        contain: 'layout style paint',
        transform: 'none', // Ensure no inherited transforms
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Lock Icon */}
      <motion.div
        className='flex justify-center mb-8 mt-20'
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.1,
          duration: 0.5,
          type: 'spring',
          stiffness: 300,
          damping: 25,
        }}
      >
        <div className='text-zinc-800 opacity-90'>
          <svg width='24' height='30' viewBox='0 0 24 30' fill='currentColor'>
            <path d='M12 0C8.7 0 6 2.7 6 6V10H4C2.9 10 2 10.9 2 12V26C2 27.1 2.9 28 4 28H20C21.1 28 22 27.1 22 26V12C22 10.9 21.1 10 20 10H18V6C18 2.7 15.3 0 12 0ZM12 2C14.2 2 16 3.8 16 6V10H8V6C8 3.8 9.8 2 12 2ZM12 18C13.1 18 14 17.1 14 16C14 14.9 13.1 14 12 14C10.9 14 10 14.9 10 16C10 17.1 10.9 18 12 18Z' />
          </svg>
        </div>
      </motion.div>

      {/* Enter Passcode Text */}
      <motion.div
        className='text-center mb-8'
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.2,
          duration: 0.4,
          type: 'spring',
          stiffness: 300,
          damping: 25,
        }}
      >
        <h2 className='text-zinc-800 text-lg ios-medium sf-pro-text'>
          Enter Passcode
        </h2>
      </motion.div>

      {/* Passcode Dots */}
      <motion.div
        className='flex justify-center mb-16'
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          delay: 0.3,
          duration: 0.4,
          type: 'spring',
          stiffness: 300,
          damping: 25,
        }}
      >
        <div className='flex space-x-4'>
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <motion.div
              key={index}
              className={`w-3 h-3 rounded-full border border-zinc-500 transition-all duration-200 ${
                index < passcode.length ? 'bg-zinc-800' : 'bg-transparent'
              } ${isShaking ? 'animate-pulse' : ''}`}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                delay: 0.4 + index * 0.05,
                duration: 0.3,
                type: 'spring',
                stiffness: 400,
                damping: 30,
              }}
            />
          ))}
        </div>
      </motion.div>

      {/* Keypad */}
      <motion.div
        className='grid grid-cols-3 gap-x-6 gap-y-4 w-full max-w-sm mx-auto mb-8'
        style={{
          // Ensure proper grid constraints
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          justifyItems: 'center',
          alignItems: 'center',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.05, duration: 0.1 }}
      >
        {keypadData.map(({ digit, letters }, index) => (
          <motion.button
            key={digit}
            onClick={() => onPasscodeInput(digit)}
            className='relative rounded-full border border-zinc-400/50 bg-zinc-300/30 flex flex-col items-center justify-center text-zinc-800 transition-all duration-150'
            style={{
              contain: 'layout style paint',
              width: '80px',
              height: '80px',
              minWidth: '80px',
              minHeight: '80px',
              maxWidth: '80px',
              maxHeight: '80px',
            }}
            initial={{
              opacity: 0,
              scale: 0.8,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            transition={{
              delay: 0.1 + index * 0.02,
              duration: 0.2,
              type: 'spring',
              stiffness: 400,
              damping: 40,
            }}
            whileTap={{
              scale: 0.92,
              backgroundColor: 'rgba(100, 100, 100, 0.25)',
              transition: {
                type: 'tween',
                duration: 0.05,
                ease: 'easeOut',
              },
            }}
          >
            <span className='text-3xl font-light leading-none pointer-events-none'>
              {digit}
            </span>
            {letters && (
              <span className='text-[10px] font-medium tracking-wider mt-0.5 opacity-80 pointer-events-none'>
                {letters}
              </span>
            )}
          </motion.button>
        ))}

        {/* Empty space, 0, Delete */}
        <div></div>
        <motion.button
          onClick={() => onPasscodeInput('0')}
          className='relative rounded-full border border-zinc-400/50 bg-zinc-300/30 flex items-center justify-center text-zinc-800 transition-all duration-150'
          style={{
            contain: 'layout style paint',
            width: '80px',
            height: '80px',
            minWidth: '80px',
            minHeight: '80px',
            maxWidth: '80px',
            maxHeight: '80px',
          }}
          initial={{
            opacity: 0,
            scale: 0.8,
          }}
          animate={{
            opacity: 1,
            scale: 1,
          }}
          transition={{
            delay: 0.1 + 9 * 0.02,
            duration: 0.2,
            type: 'spring',
            stiffness: 400,
            damping: 40,
          }}
          whileTap={{
            scale: 0.92,
            backgroundColor: 'rgba(100, 100, 100, 0.25)',
            transition: {
              type: 'tween',
              duration: 0.05,
              ease: 'easeOut',
            },
          }}
        >
          <span className='text-3xl font-light pointer-events-none'>0</span>
        </motion.button>
        <motion.button
          onClick={onDelete}
          className='relative rounded-full border border-zinc-400/50 bg-zinc-300/30 flex items-center justify-center text-zinc-800 transition-all duration-150'
          style={{
            contain: 'layout style paint',
            width: '80px',
            height: '80px',
            minWidth: '80px',
            minHeight: '80px',
            maxWidth: '80px',
            maxHeight: '80px',
          }}
          initial={{
            opacity: 0,
            scale: 0.8,
          }}
          animate={{
            opacity: 1,
            scale: 1,
          }}
          transition={{
            delay: 0.1 + 10 * 0.02,
            duration: 0.2,
            type: 'spring',
            stiffness: 400,
            damping: 40,
          }}
          whileTap={{
            scale: 0.92,
            backgroundColor: 'rgba(100, 100, 100, 0.25)',
            transition: {
              type: 'tween',
              duration: 0.05,
              ease: 'easeOut',
            },
          }}
          aria-label='Delete'
        >
          <svg
            width='24'
            height='18'
            viewBox='0 0 24 18'
            fill='currentColor'
            className='text-zinc-800 opacity-90 pointer-events-none'
          >
            <path d='M8.5 0L0 9L8.5 18H24V0H8.5ZM22 16H9.5L2.5 9L9.5 2H22V16ZM11.5 5L10 6.5L13.5 10L10 13.5L11.5 15L15 11.5L18.5 15L20 13.5L16.5 10L20 6.5L18.5 5L15 8.5L11.5 5Z' />
          </svg>
        </motion.button>
      </motion.div>

      {/* Bottom buttons */}
      <motion.div
        className='flex justify-between items-center px-6 pb-12'
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.3,
          duration: 0.2,
          type: 'spring',
          stiffness: 400,
          damping: 40,
        }}
      >
        <motion.button
          className='text-zinc-800 text-base ios-medium opacity-90 px-4 py-2 rounded-lg transition-all duration-150'
          whileTap={{
            scale: 0.92,
            opacity: 0.6,
            backgroundColor: 'rgba(100, 100, 100, 0.15)',
            transition: {
              type: 'tween',
              duration: 0.05,
              ease: 'easeOut',
            },
          }}
        >
          Emergency
        </motion.button>
        <motion.button
          onClick={onCancel}
          className='text-zinc-800 text-base ios-medium opacity-90 px-4 py-2 rounded-lg transition-all duration-150'
          whileTap={{
            scale: 0.92,
            opacity: 0.6,
            backgroundColor: 'rgba(100, 100, 100, 0.15)',
            transition: {
              type: 'tween',
              duration: 0.05,
              ease: 'easeOut',
            },
          }}
        >
          Cancel
        </motion.button>
      </motion.div>
    </motion.div>
  );
});

const LockScreen: FC = () => {
  const dispatch = useDispatch();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showPasscode, setShowPasscode] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const correctPasscode = '947491';
  const passcodeRef = useRef('');

  // Animation controls for the main container
  const containerControls = useAnimation();

  // Initialize time once on mount
  useEffect(() => {
    setCurrentTime(new Date());
  }, []);

  // Reset container position when component mounts or showPasscode changes
  useEffect(() => {
    // Always ensure container is at correct position
    containerControls.set({ y: 0 });
  }, [showPasscode, containerControls]);

  // Separate effect for timer management
  useEffect(() => {
    // Only update time if not showing passcode to prevent unnecessary re-renders
    if (!showPasscode) {
      const timer = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000);

      return () => clearInterval(timer);
    }
    return undefined;
  }, [showPasscode]);

  // Keep passcode ref in sync with state
  useEffect(() => {
    passcodeRef.current = passcode;
  }, [passcode]);

  const formatTime = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();

    // Format like iOS (9:41 style)
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    const displayMinutes = minutes.toString().padStart(2, '0');

    return `${displayHours}:${displayMinutes}`;
  };

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    };
    return date.toLocaleDateString('en-US', options);
  };

  const handleSwipeUp = useCallback(() => {
    // FIXED: Reset all drag-related state and animations
    setIsDragging(false);
    setDragY(0);

    // CRITICAL: Reset the container position using animation controls
    containerControls.set({ y: 0 });

    // Transition to passcode
    setShowPasscode(true);
  }, [containerControls]);

  const handlePasscodeInput = useCallback(
    (digit: string) => {
      const currentPasscode = passcodeRef.current;
      if (currentPasscode.length < 6) {
        const newPasscode = currentPasscode + digit;

        // Use startTransition for non-urgent state updates
        startTransition(() => {
          setPasscode(newPasscode);
        });

        if (newPasscode.length === 6) {
          // Use requestAnimationFrame instead of setTimeout for better performance
          requestAnimationFrame(() => {
            if (newPasscode === correctPasscode) {
              // Add a slight delay to mimic real iPhone unlock timing
              setTimeout(() => {
                dispatch(interfaceActions.unlock());
              }, 300);
            } else {
              startTransition(() => {
                setIsShaking(true);
                setPasscode('');
              });
              // Use requestAnimationFrame for the shake reset
              setTimeout(() => {
                startTransition(() => {
                  setIsShaking(false);
                });
              }, 500);
            }
          });
        }
      }
    },
    [dispatch, correctPasscode]
  );

  const handleDelete = useCallback(() => {
    const currentPasscode = passcodeRef.current;
    startTransition(() => {
      setPasscode(currentPasscode.slice(0, -1));
    });
  }, []);

  const handleCancelPasscode = useCallback(() => {
    // FIXED: Complete state and animation reset
    setShowPasscode(false);
    setPasscode('');
    setDragY(0);
    setIsDragging(false);
    setIsShaking(false);

    // CRITICAL: Reset container position
    containerControls.set({ y: 0 });
  }, [containerControls]);

  // iOS Camera Icon
  const CameraIcon = () => (
    <svg width='28' height='22' viewBox='0 0 28 22' fill='currentColor'>
      <path d='M26 5H22.5L20.5 2H16C15.5 2 15 1.5 15 1C15 0.5 14.5 0 14 0C13.5 0 13 0.5 13 1C13 1.5 12.5 2 12 2H7.5L5.5 5H2C0.9 5 0 5.9 0 7V19C0 20.1 0.9 21 2 21H26C27.1 21 28 20.1 28 19V7C28 5.9 27.1 5 26 5ZM14 18C10.7 18 8 15.3 8 12C8 8.7 10.7 6 14 6C17.3 6 20 8.7 20 12C20 15.3 17.3 18 14 18ZM14 8C11.8 8 10 9.8 10 12C10 14.2 11.8 16 14 16C16.2 16 18 14.2 18 12C18 9.8 16.2 8 14 8Z' />
    </svg>
  );

  // iOS Flashlight Icon
  const FlashlightIcon = () => (
    <svg width='16' height='28' viewBox='0 0 16 28' fill='currentColor'>
      <path d='M8 0C7.4 0 7 0.4 7 1V2H9V1C9 0.4 8.6 0 8 0ZM1.5 2.5L0.1 3.9L2.8 6.6L4.2 5.2L1.5 2.5ZM14.5 2.5L11.8 5.2L13.2 6.6L15.9 3.9L14.5 2.5ZM8 4C5.8 4 4 5.8 4 8C4 8.3 4 8.5 4.1 8.8L4.8 11L11.2 11L11.9 8.8C11.9 8.5 12 8.3 12 8C12 5.8 10.2 4 8 4ZM5.5 13V26.5C5.5 27.3 6.2 28 7 28H9C9.8 28 10.5 27.3 10.5 26.5V13H5.5Z' />
    </svg>
  );

  return (
    <motion.div
      className='absolute inset-0 z-50 text-zinc-800 overflow-hidden'
      drag={showPasscode ? false : 'y'}
      dragConstraints={{ top: -200, bottom: 0 }}
      dragElastic={0.2}
      dragSnapToOrigin={!showPasscode}
      animate={containerControls}
      transition={{
        type: 'spring',
        damping: 30,
        stiffness: 300,
      }}
      onDragStart={() => {
        if (!showPasscode) {
          setIsDragging(true);
        }
      }}
      onDrag={(_, info) => {
        if (!showPasscode) {
          // Update drag position for real-time feedback
          setDragY(info.offset.y);
        }
      }}
      onDragEnd={(_, info) => {
        if (!showPasscode) {
          setIsDragging(false);
          if (info.offset.y < -120) {
            // Reset drag state before transition
            setDragY(0);
            // Animate back to original position before showing keypad
            containerControls
              .start({ y: 0, transition: { duration: 0.3 } })
              .then(() => {
                handleSwipeUp();
              });
          } else {
            // Snap back to original position
            setDragY(0);
            containerControls.start({ y: 0, transition: { duration: 0.3 } });
          }
        }
      }}
      style={{
        // CRITICAL: No background - use iPhone shell's unified background
        background: 'none',
        backdropFilter: 'none',
        // Ensure no residual transforms
        transform: 'none',
      }}
    >
      {/* Lock Screen Content - Responds to drag */}
      {!showPasscode && (
        <motion.div
          className='relative z-10 h-full flex flex-col'
          animate={{
            // Only apply visual feedback, not actual position
            opacity: Math.max(0.4, 1 - Math.abs(dragY) / 400),
            scale: Math.max(0.98, 1 - Math.abs(dragY) / 2000),
          }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 30,
            mass: 0.5,
          }}
          style={{
            // CRITICAL: Content has no background
            background: 'none',
          }}
        >
          {/* Top section with time and date - positioned like iOS */}
          <div className='pt-20 px-6'>
            {/* Date */}
            <motion.div
              className='text-center mb-2'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className='ios-lock-date opacity-90'>
                {formatDate(currentTime)}
              </div>
            </motion.div>

            {/* Time */}
            <motion.div
              className='text-center mb-8'
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <div className='ios-lock-time' suppressHydrationWarning>
                {formatTime(currentTime)}
              </div>
            </motion.div>
          </div>

          {/* Spacer to push bottom content down */}
          <div className='flex-1' />

          {/* Bottom section */}
          <motion.div
            className='pb-8 px-8'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            {/* Camera and Flashlight shortcuts */}
            <div className='flex justify-between items-center mb-4'>
              <motion.button
                className='w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center'
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <FlashlightIcon />
              </motion.button>

              <motion.button
                className='w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center'
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <CameraIcon />
              </motion.button>
            </div>

            {/* Swipe indicator - exactly like iOS */}
            <div className='text-center'>
              <motion.div
                className='flex flex-col items-center space-y-2'
                animate={{
                  y: isDragging ? [0, -2, 0] : [-1, 1, -1],
                  opacity: isDragging ? 0.3 : 1,
                }}
                transition={{
                  repeat: isDragging ? 0 : Infinity,
                  duration: 2,
                  ease: 'easeInOut',
                }}
              >
                <div className='text-base ios-medium opacity-60 sf-pro-text tracking-tight'>
                  Swipe up to unlock
                </div>
                <motion.div
                  className='w-32 h-1 bg-white/40 rounded-full'
                  animate={{
                    scaleX: isDragging ? 0.7 : 1,
                    opacity: isDragging ? 0.3 : 1,
                  }}
                />
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Passcode Keypad - Completely isolated layer */}
      <AnimatePresence mode='wait'>
        {showPasscode && (
          <motion.div
            key='passcode-keypad'
            className='absolute inset-0 z-40'
            initial={{
              opacity: 0,
              scale: 0.95,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              scale: 0.95,
            }}
            transition={{
              duration: 0.4,
              ease: [0.23, 1, 0.32, 1],
            }}
            style={{
              // CRITICAL: Keypad container has no transform inheritance
              transform: 'none',
              background: 'none',
            }}
          >
            <PasscodeKeypad
              passcode={passcode}
              isShaking={isShaking}
              onPasscodeInput={handlePasscodeInput}
              onDelete={handleDelete}
              onCancel={handleCancelPasscode}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default LockScreen;
