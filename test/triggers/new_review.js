const { API_BASE_URL } = require('../../constants');
const { expect } = require('chai');
const zapier = require('zapier-platform-core');
const nock = require('nock');
const App = require('../../index');

const appTester = zapier.createAppTester(App);

describe('WaniKani App', () => {
  it('declares a new review trigger', () =>
    expect(App.triggers.new_review).to.exist);

  describe('new review trigger', () => {
    describe('given WaniKani returns a valid list of reviews', () => {
      const getReviewsResponse = require('../fixtures/responses/getReviewsResponse'); // eslint-disable-line global-require

      let result;
      before(async () => {
        nock(API_BASE_URL)
          .get('/assignments')
          .query(true)
          .reply(200, getReviewsResponse);

        // when the user tries to get a list of reviews
        result = await appTester(App.triggers.new_review.operation.perform);
      });

      it('returns the expected levels', () => {
        expect(result.length).to.eql(6);
        expect(result).to.all.contain.property('id');
        expect(result).to.all.contain.property('availableAt');
        expect(result).to.all.contain.property('totalNumberOfReviews');
        expect(result[0].availableAt).to.eql('2019-12-11T23:00:00Z');
      });

      it('removes unnecessary attributes from the returned object', () => {
        expect(result).to.not.contain.any.item.with.property('url');
        expect(result).to.not.contain.any.item.with.property('object');
        expect(result).to.not.contain.any.item.with.property('data');
        expect(result).to.not.contain.any.item.with.property('data_updated_at');
      });
    });

    describe('given WaniKani returns no reviews', () => {
      const noReviewsResponse = require('../fixtures/responses/noReviewsResponse'); // eslint-disable-line global-require

      let result;
      before(async () => {
        nock(API_BASE_URL)
          .get('/assignments')
          .query(true)
          .reply(200, noReviewsResponse);

        // when the user tries to get a list of reviews
        result = await appTester(App.triggers.new_review.operation.perform);
      });

      it('returns an empty list with no levels', () => {
        expect(result.length).to.eql(0);
      });
    });

    describe('given WaniKani returns an invalid response', () => {
      before(() => {
        nock(API_BASE_URL)
          .get('/assignments')
          .query(true)
          .reply(500, { error: 'some random error', code: 500 });
      });

      it('returns a descriptive message', async () => {
        await expect(
          appTester(App.triggers.new_review.operation.perform)
        ).to.be.rejectedWith('Unable to retrieve reviews: some random error');
      });
    });
  });
});
