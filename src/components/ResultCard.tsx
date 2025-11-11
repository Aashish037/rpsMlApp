import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {GameResult} from '../utils/gameLogic';

interface ResultCardProps {
  result: string;
  gameResult?: GameResult;
}

export default function ResultCard({result, gameResult}: ResultCardProps) {
  const getCardStyle = () => {
    switch (gameResult) {
      case 'win':
        return [styles.card, styles.winCard];
      case 'lose':
        return [styles.card, styles.loseCard];
      case 'draw':
        return [styles.card, styles.drawCard];
      default:
        return [styles.card, styles.defaultCard];
    }
  };

  const getTextStyle = () => {
    switch (gameResult) {
      case 'win':
        return [styles.text, styles.winText];
      case 'lose':
        return [styles.text, styles.loseText];
      case 'draw':
        return [styles.text, styles.drawText];
      default:
        return styles.text;
    }
  };

  return (
    <View style={getCardStyle()}>
      <Text style={getTextStyle()}>{result}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    padding: 16,
    borderRadius: 12,
    minWidth: 200,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  defaultCard: {
    backgroundColor: '#222',
  },
  winCard: {
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#66BB6A',
  },
  loseCard: {
    backgroundColor: '#F44336',
    borderWidth: 2,
    borderColor: '#EF5350',
  },
  drawCard: {
    backgroundColor: '#FF9800',
    borderWidth: 2,
    borderColor: '#FFB74D',
  },
  text: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  winText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  loseText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  drawText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});
