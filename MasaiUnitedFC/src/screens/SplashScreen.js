import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function SplashScreen({ onDone }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const exitAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 5, tension: 60, useNativeDriver: true }),
    ]).start(() => {
      setTimeout(() => {
        Animated.timing(exitAnim, { toValue: 0, duration: 400, useNativeDriver: true }).start(onDone);
      }, 1800);
    });
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: exitAnim }]}>
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        {/* Shield / Badge */}
        <View style={styles.shield}>
          <View style={styles.shieldInner}>
            <Text style={styles.shieldInitials}>M</Text>
            <View style={styles.shieldDivider} />
            <Text style={styles.shieldSub}>United</Text>
          </View>
        </View>

        {/* Club Name */}
        <Text style={styles.clubName}>MASAI UNITED FC</Text>
        <View style={styles.nameLine} />
        <Text style={styles.clubTagline}>Est. 2007  •  Kuala Lumpur</Text>
      </Animated.View>

      {/* Bottom strip */}
      <Animated.View style={[styles.bottomStrip, { opacity: fadeAnim }]}>
        <View style={styles.stripLine} />
        <Text style={styles.stripText}>LIONS OF MASAI</Text>
        <View style={styles.stripLine} />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
  },
  shield: {
    width: 160,
    height: 185,
    backgroundColor: '#C41E3A',
    borderRadius: 12,
    borderBottomLeftRadius: 80,
    borderBottomRightRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#C41E3A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 20,
    borderWidth: 3,
    borderColor: '#FFD700',
  },
  shieldInner: {
    alignItems: 'center',
  },
  shieldInitials: {
    fontSize: 72,
    fontWeight: '900',
    color: '#FFD700',
    lineHeight: 80,
    letterSpacing: -2,
  },
  shieldDivider: {
    width: 80,
    height: 2,
    backgroundColor: '#FFD700',
    marginVertical: 4,
  },
  shieldSub: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFD700',
    letterSpacing: 4,
  },
  clubName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 3,
    textAlign: 'center',
  },
  nameLine: {
    width: 60,
    height: 3,
    backgroundColor: '#FFD700',
    marginTop: 10,
    marginBottom: 8,
    borderRadius: 2,
  },
  clubTagline: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 2,
    fontWeight: '600',
  },
  bottomStrip: {
    position: 'absolute',
    bottom: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
  },
  stripLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,215,0,0.3)',
  },
  stripText: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255,215,0,0.5)',
    letterSpacing: 4,
  },
});
