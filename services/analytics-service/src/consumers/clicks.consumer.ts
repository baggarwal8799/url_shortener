import { Consumer, EachMessagePayload } from 'kafkajs';
import pool from '../config/database';

interface ClickEvent {
  shortCode: string;
  timestamp: string;
  ip: string;
  userAgent: string;
  referer: string;
}

let clickBatch: ClickEvent[] = [];
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '100');
const BATCH_TIMEOUT_MS = parseInt(process.env.BATCH_TIMEOUT_MS || '5000');
let batchTimer: NodeJS.Timeout | null = null;

/**
 * Process click event from Kafka
 */
export const processClickEvent = async (payload: EachMessagePayload): Promise<void> => {
  try {
    const message = payload.message;

    if (!message.value) {
      console.warn('Received empty message');
      return;
    }

    // Parse click event
    const clickEvent: ClickEvent = JSON.parse(message.value.toString());

    console.log(`📊 Received click event for ${clickEvent.shortCode}`);

    // Add to batch
    clickBatch.push(clickEvent);

    // If batch is full, flush it
    if (clickBatch.length >= BATCH_SIZE) {
      await flushBatch();
    } else {
      // Reset timer for batch timeout
      if (batchTimer) {
        clearTimeout(batchTimer);
      }
      batchTimer = setTimeout(async () => {
        if (clickBatch.length > 0) {
          await flushBatch();
        }
      }, BATCH_TIMEOUT_MS);
    }
  } catch (error) {
    console.error('Error processing click event:', error);
  }
};

/**
 * Flush batch of clicks to database
 */
async function flushBatch(): Promise<void> {
  if (clickBatch.length === 0) return;

  const batchToInsert = [...clickBatch];
  clickBatch = []; // Clear batch immediately

  if (batchTimer) {
    clearTimeout(batchTimer);
    batchTimer = null;
  }

  try {
    console.log(`💾 Flushing batch of ${batchToInsert.length} clicks to database`);

    // Get URL IDs for all short codes in batch
    const shortCodes = [...new Set(batchToInsert.map(click => click.shortCode))];

    const urlsResult = await pool.query(
      'SELECT id, short_code FROM urls WHERE short_code = ANY($1) OR custom_alias = ANY($1)',
      [shortCodes]
    );

    // Create a map of shortCode -> url_id
    const urlIdMap: Record<string, number> = {};
    urlsResult.rows.forEach(row => {
      urlIdMap[row.short_code] = row.id;
    });

    // Build batch insert query
    const values: any[] = [];
    const placeholders: string[] = [];
    let paramIndex = 1;

    for (const click of batchToInsert) {
      const urlId = urlIdMap[click.shortCode];

      if (!urlId) {
        console.warn(`URL not found for short code: ${click.shortCode}`);
        continue;
      }

      placeholders.push(
        `($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, $${paramIndex + 5})`
      );

      values.push(
        urlId,
        click.shortCode,
        click.ip,
        click.userAgent,
        click.referer,
        click.timestamp
      );

      paramIndex += 6;
    }

    if (placeholders.length === 0) {
      console.warn('No valid clicks to insert');
      return;
    }

    // Insert all clicks in one query
    const query = `
      INSERT INTO clicks (url_id, short_code, ip_address, user_agent, referer, clicked_at)
      VALUES ${placeholders.join(', ')}
    `;

    await pool.query(query, values);

    console.log(`✅ Successfully inserted ${placeholders.length} clicks`);

    // Update click counts in urls table
    for (const shortCode of shortCodes) {
      await pool.query(
        'UPDATE urls SET click_count = (SELECT COUNT(*) FROM clicks WHERE short_code = $1) WHERE short_code = $1 OR custom_alias = $1',
        [shortCode]
      );
    }

    console.log(`✅ Updated click counts for ${shortCodes.length} URLs`);
  } catch (error) {
    console.error('Error flushing batch to database:', error);
    // Re-add failed batch items back to queue
    clickBatch = [...batchToInsert, ...clickBatch];
  }
}

/**
 * Start consuming click events from Kafka
 */
export const startClicksConsumer = async (consumer: Consumer): Promise<void> => {
  const topic = process.env.KAFKA_TOPIC_CLICKS || 'click.events';

  await consumer.subscribe({ topic, fromBeginning: false });

  console.log(`🎧 Subscribed to Kafka topic: ${topic}`);

  await consumer.run({
    eachMessage: processClickEvent,
  });

  console.log('🚀 Clicks consumer started');
};

/**
 * Force flush on shutdown
 */
export const shutdownConsumer = async (): Promise<void> => {
  console.log('🛑 Shutting down clicks consumer...');

  if (batchTimer) {
    clearTimeout(batchTimer);
  }

  await flushBatch();
  console.log('✅ Final batch flushed');
};
