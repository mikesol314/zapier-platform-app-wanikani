const { API_BASE_URL } = require('../../constants');
const { expect } = require('chai');
const zapier = require('zapier-platform-core');
const nock = require('nock');
const App = require('../../index');

const appTester = zapier.createAppTester(App);

describe('WaniKani App', () => {
  it('declares a new level trigger', () =>
    expect(App.triggers.new_level).to.exist);

  describe('new level trigger', () => {
    describe('given WaniKani returns a valid list of levels', () => {
      const getLevelsResponse = require('../fixtures/responses/getLevelsResponse'); // eslint-disable-line global-require

      let result;
      before(async () => {
        nock(API_BASE_URL)
          .get('/level_progressions')
          .query(true)
          .reply(200, getLevelsResponse);

        // when the user tries to get a list of levels
        result = await appTester(App.triggers.new_level.operation.perform);
      });

      it('returns the expected levels', () => {
        expect(result.length).to.eql(10);
        expect(result).to.all.contain.property('id');
        expect(result).to.all.contain.property('unlockedAt');
        expect(result[0].unlockedAt).to.eql('2018-11-05T06:37:24Z');
      });

      it('removes unnecessary attributes from the returned object', () => {
        expect(result).to.not.contain.any.item.with.property('url');
        expect(result).to.not.contain.any.item.with.property('object');
        expect(result).to.not.contain.any.item.with.property('data');
        expect(result).to.not.contain.any.item.with.property('data_updated_at');
      });
    });

    describe('given WaniKani returns no levels', () => {
      let result;
      before(async () => {
        nock(API_BASE_URL)
          .get('/level_progressions')
          .query(true)
          .reply(200, []);

        // when the user tries to get a list of levels
        result = await appTester(App.triggers.new_level.operation.perform);
      });

      it('returns an empty list with no levels', () => {
        expect(result.length).to.eql(0);
      });
    });

    describe('given WaniKani returns an invalid response', () => {
      before(() => {
        nock(API_BASE_URL)
          .get('/level_progressions')
          .query(true)
          .reply(500, { error: 'some random error', code: 500 });
      });

      it('returns a descriptive message', async () => {
        await expect(
          appTester(App.triggers.new_level.operation.perform)
        ).to.be.rejectedWith(
          'Unable to retrieve current user level: some random error'
        );
      });
    });
  });
});
