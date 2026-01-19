/**
 * Migration Helper - Easy way to test and run car image migrations
 * 
 * Usage in console:
 * import { runMigrationTest, runMigration } from './utils/migrationHelper';
 * await runMigrationTest();  // Dry run
 * await runMigration();       // Actual migration
 */

import { migrateExistingCarImages } from '../services/carService';

/**
 * Run a dry run migration test (safe, no changes)
 * Shows what would be migrated without actually saving
 */
export const runMigrationTest = async () => {
  console.log('🧪 Starting migration test (dry run)...');
  const result = await migrateExistingCarImages(true);
  
  if (result.success) {
    console.log('✅ Test completed successfully!');
    console.log('📊 Statistics:', result.stats);
    console.log('\n💡 To run actual migration, use: runMigration()');
  } else {
    console.error('❌ Test failed:', result.error);
  }
  
  return result;
};

/**
 * Run actual migration (saves to backend)
 * WARNING: This will modify your database
 */
export const runMigration = async () => {
  console.log('🔄 Starting actual migration...');
  console.log('⚠️  WARNING: This will save data to backend!');
  
  const result = await migrateExistingCarImages(false);
  
  if (result.success) {
    console.log('✅ Migration completed successfully!');
    console.log('📊 Statistics:', result.stats);
    
    if (result.stats.failed > 0) {
      console.warn('⚠️  Some cars failed to migrate. Check errors above.');
    }
  } else {
    console.error('❌ Migration failed:', result.error);
  }
  
  return result;
};

/**
 * Get migration status for all cars
 * Shows which cars have backend images and which don't
 */
export const checkMigrationStatus = async () => {
  const { getHostCars } = require('../services/carService');
  
  console.log('🔍 Checking migration status...');
  
  const result = await getHostCars();
  
  if (!result.success || !result.cars) {
    console.error('❌ Failed to fetch cars');
    return null;
  }
  
  const status = {
    total: result.cars.length,
    withBackendImages: 0,
    withoutBackendImages: 0,
    withoutAnyImages: 0,
    cars: [],
  };
  
  result.cars.forEach(car => {
    const hasBackendImages = !!(car.cover_image || (car.car_images && car.car_images.length > 0));
    const hasSupabaseImages = !!(car.coverPhoto || (car.imageUrls && car.imageUrls.length > 0));
    
    status.cars.push({
      id: car.id,
      name: car.name,
      hasBackendImages,
      hasSupabaseImages,
      needsMigration: hasSupabaseImages && !hasBackendImages,
    });
    
    if (hasBackendImages) {
      status.withBackendImages++;
    } else if (hasSupabaseImages) {
      status.withoutBackendImages++;
    } else {
      status.withoutAnyImages++;
    }
  });
  
  console.log('\n📊 Migration Status:');
  console.log(`   Total cars: ${status.total}`);
  console.log(`   ✅ With backend images: ${status.withBackendImages}`);
  console.log(`   🔄 Need migration: ${status.withoutBackendImages}`);
  console.log(`   ⚠️  No images: ${status.withoutAnyImages}`);
  
  if (status.withoutBackendImages > 0) {
    console.log('\n🚗 Cars that need migration:');
    status.cars
      .filter(c => c.needsMigration)
      .forEach(c => console.log(`   - Car ${c.id}: ${c.name || 'Unnamed'}`));
  }
  
  return status;
};
