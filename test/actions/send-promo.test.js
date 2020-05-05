/*
* <license header>
*/

jest.mock('@adobe/aio-sdk', () => ({
  CampaignStandard: {
    init: jest.fn()
  },
  Core: {
    Logger: jest.fn()
  }
}))

const { Core, CampaignStandard } = require('@adobe/aio-sdk')
const mockCampaignStandardInstance = { getAllProfiles: jest.fn() }
const mockLoggerInstance = { info: jest.fn(), debug: jest.fn(), error: jest.fn() }
Core.Logger.mockReturnValue(mockLoggerInstance)
CampaignStandard.init.mockResolvedValue(mockCampaignStandardInstance)

const action = require('./../../actions/send-promo/index.js')

beforeEach(() => {
  CampaignStandard.init.mockClear() // only clears calls stats
  mockCampaignStandardInstance.getAllProfiles.mockReset() // clears calls + mock implementation

  Core.Logger.mockClear()
  mockLoggerInstance.info.mockReset()
  mockLoggerInstance.debug.mockReset()
  mockLoggerInstance.error.mockReset()
})

const fakeRequestParams = { tenant: 'fakeId', apiKey: 'fakeKey', __ow_headers: { authorization: 'Bearer fakeToken' } }
describe('send-promo', () => {
  test('main should be defined', () => {
    expect(action.main).toBeInstanceOf(Function)
  })
  test('should set logger to use LOG_LEVEL param', async () => {
    await action.main({ ...fakeRequestParams, LOG_LEVEL: 'fakeLevel' })
    expect(Core.Logger).toHaveBeenCalledWith(expect.any(String), { level: 'fakeLevel' })
  })
  test('CampaignStandard sdk should be initialized with input credentials', async () => {
    await action.main({ ...fakeRequestParams, otherParam: 'fake4' })
    expect(CampaignStandard.init).toHaveBeenCalledWith('fakeId', 'fakeKey', 'fakeToken')
  })
  test('should return an http response with CampaignStandard profiles', async () => {
    const fakeResponse = { profiles: 'fake' }
    mockCampaignStandardInstance.getAllProfiles.mockResolvedValue(fakeResponse)
    const response = await action.main(fakeRequestParams)
    expect(response).toEqual({
      statusCode: 200,
      body: fakeResponse
    })
  })
  test('if there is an error should return a 500 and log the error', async () => {
    const fakeError = new Error('fake')
    mockCampaignStandardInstance.getAllProfiles.mockRejectedValue(fakeError)
    const response = await action.main(fakeRequestParams)
    expect(response).toEqual({
      error: {
        statusCode: 500,
        body: { error: 'server error' }
      }
    })
    expect(mockLoggerInstance.error).toHaveBeenCalledWith(fakeError)
  })
  test('missing input request parameters, should return 400', async () => {
    const response = await action.main({})
    expect(response).toEqual({
      error: {
        statusCode: 400,
        body: { error: 'missing header(s) \'authorization\' and missing parameter(s) \'apiKey,tenant\'' }
      }
    })
  })
})
