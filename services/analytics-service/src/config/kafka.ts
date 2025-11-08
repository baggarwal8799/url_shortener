import { Kafka, Consumer } from 'kafkajs';
import dotenv from 'dotenv';

dotenv.config();

const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID || 'analytics-service',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
});

let consumer: Consumer | null = null;

export const getConsumer = async (): Promise<Consumer> => {
  if (!consumer) {
    consumer = kafka.consumer({
      groupId: process.env.KAFKA_GROUP_ID || 'analytics-group'
    });
    await consumer.connect();
    console.log('✅ Connected to Kafka (Consumer)');
  }
  return consumer;
};

export const disconnectConsumer = async (): Promise<void> => {
  if (consumer) {
    await consumer.disconnect();
    console.log('👋 Disconnected from Kafka');
  }
};

export default kafka;
