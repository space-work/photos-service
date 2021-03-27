const nano = require('nano')('http://sdc:SDC1234567890!@localhost:5984');
const dbName = 'spaceworkphotos';
const db = nano.use(dbName);
const dbHelpers = require('../index.js');
const seedHelper = require('./helpers.js');
const { v4: uuidv4 } = require('uuid');


const seed = async () => {
  console.time('seed');
  // get data for seed
  let photoUrls = await seedHelper.getPhotos();
  let photoDescriptionWords = await seedHelper.getPhotoDescriptions();

  // prepare database
  console.log('Deleting existing db:');
  await dbHelpers.deleteDb(dbName);
  console.log('Creating db:');
  await dbHelpers.createDb(dbName);

  let batchInsertCount = 5000;
  let primaryRecordCount = 10000000;
  let PrimaryRecordBatchInserts = Math.floor(primaryRecordCount / batchInsertCount);

  let photoUrlsLength = photoUrls.length;
  let descriptionWordsLength = photoDescriptionWords.length;
  let photosCount = 0;
  let workspace_id = 1;

  // let fakeBatchInsertCount = 2500;
  // let fakePrimaryRecordCount = 10000;
  // let fakePrimaryRecordBatchInserts = Math.floor(fakePrimaryRecordCount / fakeBatchInsertCount);

  // Loop to insert batches of data into db
  for (let i = 0; i < PrimaryRecordBatchInserts; i++) {
    let recordBatch = [];
    let photosIndex = 0;
    let desciptionWordsIndex = 0;

    // Loop to create a batch of data to insert into db
    for (let j = 0; j < batchInsertCount; j++) {

      let randomNumOfPhotosForWorkspace = seedHelper.randomIntBetween(4,7);
      let photosInfo = [];

      // Loop to create an array with the workspace photos information
      for (let k = 0; k < randomNumOfPhotosForWorkspace; k++) {

        let photoInfo = {
          url: photoUrls[photosIndex],
          description: photoDescriptionWords[desciptionWordsIndex]
        };
        photosInfo.push(photoInfo);
        photosIndex++;
        desciptionWordsIndex++;
        if (photosIndex === photoUrlsLength) {
          photosIndex = 0;
        } else if (desciptionWordsIndex === descriptionWordsLength) {
          desciptionWordsIndex = 0;
        }
      };
      let record = {
        id: `${uuidv4()}`,
        workspace_id: `${workspace_id}`,
        photos: photosInfo
      }
      recordBatch.push(record);
      workspace_id++;
    };
    const res = await db.bulk({ docs: recordBatch });

    if ((i / PrimaryRecordBatchInserts) === 0.25) {
      console.log('seed 25% complete')
    } else if ((i / PrimaryRecordBatchInserts) === 0.50) {
      console.log('seed 50% complete')
    } else if ((i / PrimaryRecordBatchInserts) === 0.75) {
      console.log('seed 75% complete')
    }
    recordBatch = [];
  }

  const indexDef = {
    index: { fields: ['workspace_id'] },
    name: 'workspaceId-index'
  };
  const res = await db.createIndex(indexDef);
  console.log('Created index: ', res);

  console.timeEnd('seed');
};

seed();