import { db } from '../../database';
import { FormRepository, Form } from '../formRepository';

describe('FormRepository', () => {
  let formRepository: FormRepository;
  
  // Test form data
  const testForm: Omit<Form, 'created_at' | 'updated_at'> = {
    id: 'test-form-123',
    name: 'Test Newsletter Signup',
    status: 'active',
    form_type: 'popup',
    views: 1000,
    submissions: 250,
    conversions: 100,
    created_date: new Date('2023-01-01'),
    metadata: {
      source: 'test',
      platform: 'web',
      tags: ['newsletter', 'signup']
    }
  };
  
  // Setup test database before tests
  beforeAll(async () => {
    // Create a temporary forms table for testing
    await db.query(`
      CREATE TEMPORARY TABLE klaviyo_forms (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'active',
        form_type VARCHAR(100),
        views INTEGER DEFAULT 0,
        submissions INTEGER DEFAULT 0,
        conversions INTEGER DEFAULT 0,
        created_date TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL,
        metadata JSONB
      );
    `);
    
    formRepository = new FormRepository();
  });
  
  // Clean up after each test
  afterEach(async () => {
    await db.query('DELETE FROM klaviyo_forms');
  });
  
  // Clean up after all tests
  afterAll(async () => {
    await db.query('DROP TABLE IF EXISTS klaviyo_forms');
  });
  
  describe('create', () => {
    it('should create a new form', async () => {
      const result = await formRepository.create(testForm);
      
      // Check if the form was created
      expect(result).toBeDefined();
      expect(result.id).toBe(testForm.id);
      expect(result.name).toBe(testForm.name);
      expect(result.status).toBe(testForm.status);
      expect(result.form_type).toBe(testForm.form_type);
      expect(result.views).toBe(testForm.views);
      expect(result.submissions).toBe(testForm.submissions);
      expect(result.conversions).toBe(testForm.conversions);
      
      // Check if timestamps were set
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
      
      // Check if metadata was stored
      expect(result.metadata).toEqual(testForm.metadata);
    });
  });
  
  describe('findById', () => {
    it('should find a form by ID', async () => {
      // Create a form first
      await formRepository.create(testForm);
      
      // Now find it by ID
      const result = await formRepository.findById(testForm.id);
      
      // Check if the form was found
      expect(result).toBeDefined();
      expect(result?.id).toBe(testForm.id);
      expect(result?.name).toBe(testForm.name);
    });
    
    it('should return null for non-existent ID', async () => {
      // Try to find a form with a non-existent ID
      const result = await formRepository.findById('non-existent-id');
      
      // Check if null was returned
      expect(result).toBeNull();
    });
  });
  
  describe('findByName', () => {
    it('should find forms by partial name match', async () => {
      // Create forms first
      await formRepository.create(testForm);
      await formRepository.create({
        ...testForm,
        id: 'test-form-456',
        name: 'Test Contact Form'
      });
      
      // Now find forms by partial name
      const results = await formRepository.findByName('Newsletter');
      
      // Check if the form was found
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe(testForm.id);
      expect(results[0].name).toBe(testForm.name);
      
      // Try a different search
      const resultsAll = await formRepository.findByName('Test');
      expect(resultsAll).toHaveLength(2);
    });
    
    it('should return empty array for no matches', async () => {
      // Create a form first
      await formRepository.create(testForm);
      
      // Try to find forms with a non-matching name
      const results = await formRepository.findByName('NonExistentName');
      
      // Check if empty array was returned
      expect(results).toHaveLength(0);
    });
  });
  
  describe('createOrUpdate', () => {
    it('should create a new form if it does not exist', async () => {
      const result = await formRepository.createOrUpdate({
        ...testForm,
        created_at: new Date('2023-01-01T00:00:00Z')
      });
      
      // Check if the form was created
      expect(result).toBeDefined();
      expect(result.id).toBe(testForm.id);
      expect(result.name).toBe(testForm.name);
      expect(result.created_at).toEqual(new Date('2023-01-01T00:00:00Z'));
    });
    
    it('should update an existing form', async () => {
      // Create a form first
      await formRepository.create(testForm);
      
      // Now update it
      const updatedForm = {
        ...testForm,
        name: 'Updated Form Name',
        status: 'draft',
        views: 2000,
        created_at: new Date('2023-01-01T00:00:00Z')
      };
      
      const result = await formRepository.createOrUpdate(updatedForm);
      
      // Check if the form was updated
      expect(result).toBeDefined();
      expect(result.id).toBe(testForm.id);
      expect(result.name).toBe(updatedForm.name);
      expect(result.status).toBe(updatedForm.status);
      expect(result.views).toBe(updatedForm.views);
      
      // Created_at should not change
      expect(result.created_at).toEqual(new Date('2023-01-01T00:00:00Z'));
      
      // Updated_at should change
      expect(result.updated_at).not.toEqual(result.created_at);
    });
  });
  
  describe('updateMetrics', () => {
    it('should update only the specified metrics', async () => {
      // Create a form first
      const created = await formRepository.create(testForm);
      
      // Wait a moment to ensure updated_at will be different
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Now update specific metrics
      const result = await formRepository.updateMetrics(testForm.id, {
        views: 1500,
        submissions: 350
      });
      
      // Check if the metrics were updated
      expect(result).toBeDefined();
      expect(result?.id).toBe(testForm.id);
      expect(result?.views).toBe(1500);
      expect(result?.submissions).toBe(350);
      
      // These should remain unchanged
      expect(result?.conversions).toBe(testForm.conversions);
      
      // Updated_at should be newer
      expect(result?.updated_at.getTime()).toBeGreaterThan(created.updated_at.getTime());
    });
    
    it('should return null for non-existent ID', async () => {
      // Try to update metrics for a non-existent form
      const result = await formRepository.updateMetrics('non-existent-id', {
        views: 1500
      });
      
      // Check if null was returned
      expect(result).toBeNull();
    });
  });
  
  describe('createBatch', () => {
    it('should create multiple forms in a batch', async () => {
      const forms = [
        testForm,
        {
          ...testForm,
          id: 'test-form-456',
          name: 'Test Contact Form',
          status: 'active'
        },
        {
          ...testForm,
          id: 'test-form-789',
          name: 'Test Discount Popup',
          status: 'draft'
        }
      ];
      
      // Create forms in a batch
      const results = await formRepository.createBatch(forms);
      
      // Check if all forms were created
      expect(results).toHaveLength(3);
      expect(results.map(f => f.id)).toEqual(forms.map(f => f.id));
      expect(results.map(f => f.name)).toEqual(forms.map(f => f.name));
      
      // Check if data is stored in the database
      const dbForms = await formRepository.findAll(10, 0);
      expect(dbForms).toHaveLength(3);
    });
  });
  
  describe('getPerformanceMetrics', () => {
    it('should calculate performance metrics correctly', async () => {
      // Create multiple forms
      await formRepository.createBatch([
        testForm,
        {
          ...testForm,
          id: 'test-form-456',
          name: 'Test Contact Form',
          views: 2000,
          submissions: 500,
          conversions: 150
        }
      ]);
      
      // Get performance metrics
      const startDate = new Date('2022-01-01');
      const endDate = new Date('2024-01-01');
      const metrics = await formRepository.getPerformanceMetrics(startDate, endDate);
      
      // Check metrics calculations
      expect(metrics.totalForms).toBe(2);
      expect(metrics.totalViews).toBe(3000); // 1000 + 2000
      expect(metrics.totalSubmissions).toBe(750); // 250 + 500
      expect(metrics.totalConversions).toBe(250); // 100 + 150
      
      // Check rate calculations
      expect(metrics.avgSubmissionRate).toBeCloseTo((750 / 3000) * 100, 2); // (totalSubmissions / totalViews) * 100
      expect(metrics.avgConversionRate).toBeCloseTo((250 / 750) * 100, 2); // (totalConversions / totalSubmissions) * 100
    });
    
    it('should return zeros when no forms match date range', async () => {
      // Create a form
      await formRepository.create(testForm);
      
      // Get performance metrics for a different time range
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2026-01-01');
      const metrics = await formRepository.getPerformanceMetrics(startDate, endDate);
      
      // Check if zero metrics were returned
      expect(metrics.totalForms).toBe(0);
      expect(metrics.totalViews).toBe(0);
      expect(metrics.totalSubmissions).toBe(0);
      expect(metrics.totalConversions).toBe(0);
      expect(metrics.avgSubmissionRate).toBe(0);
      expect(metrics.avgConversionRate).toBe(0);
    });
  });

  describe('findUpdatedSince', () => {
    it('should find forms updated since a given timestamp', async () => {
      // Create a form
      const firstForm = await formRepository.create(testForm);
      
      // Wait a moment to ensure timestamps differ
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Create another form
      const secondForm = await formRepository.create({
        ...testForm,
        id: 'test-form-456',
        name: 'Test Contact Form'
      });
      
      // Find forms updated after the first form's creation
      const cutoffTime = new Date(firstForm.updated_at.getTime() + 1);
      const updatedForms = await formRepository.findUpdatedSince(cutoffTime);
      
      // Should only find the second form
      expect(updatedForms).toHaveLength(1);
      expect(updatedForms[0].id).toBe('test-form-456');
      expect(updatedForms[0].name).toBe('Test Contact Form');
    });
    
    it('should return empty array when no forms are updated since the timestamp', async () => {
      // Create a form
      await formRepository.create(testForm);
      
      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Use current time as cutoff
      const cutoffTime = new Date();
      const updatedForms = await formRepository.findUpdatedSince(cutoffTime);
      
      // Should find no forms
      expect(updatedForms).toHaveLength(0);
    });
  });

  describe('getLatestUpdateTimestamp', () => {
    it('should return the latest update timestamp', async () => {
      // Create a form
      const firstForm = await formRepository.create(testForm);
      
      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Create another form with a later timestamp
      const secondForm = await formRepository.create({
        ...testForm,
        id: 'test-form-456',
        name: 'Test Contact Form'
      });
      
      // Get latest timestamp
      const latestTimestamp = await formRepository.getLatestUpdateTimestamp();
      
      // Should match the second form's updated_at
      expect(latestTimestamp).toBeInstanceOf(Date);
      expect(latestTimestamp?.getTime()).toBe(secondForm.updated_at.getTime());
    });
    
    it('should return null when no forms exist', async () => {
      // Get latest timestamp from empty table
      const latestTimestamp = await formRepository.getLatestUpdateTimestamp();
      
      // Should be null
      expect(latestTimestamp).toBeNull();
    });
  });
});