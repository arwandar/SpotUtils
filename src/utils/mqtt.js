import { format } from 'date-fns'
import mqtt from 'mqtt'

import config from '../../config.json'

const clientId = `mqtt_${Math.random().toString(16).slice(3)}`
console.log('Pixelle::mqtt.js::6::clientId =>', clientId)
const connectUrl = `mqtt://${config.mqtt.host}:${config.mqtt.port}`

const client = mqtt.connect(connectUrl, {
  clientId,
  clean: true,
  connectTimeout: 4000,
  username: config.mqtt.username,
  password: config.mqtt.password,
  reconnectPeriod: 1000,
})

const stateTopic = 'spotutils/state'
export const startMqtt = () => {
  client.publish(
    'homeassistant/sensor/spotutils/date/config',
    JSON.stringify({
      name: 'Last Spotutils Error',
      object_id: 'spotutils_error',
      state_topic: stateTopic,
      value_template: '{{ value_json.date}}',
      json_attributes_topic: stateTopic,
    })
  )
}

export const addError = (error) => {
  client.publish(
    stateTopic,
    JSON.stringify({
      date: format(new Date(), 'dd/MM/yyyy hh:mm:ss'),
      uri: error.config.url,
      verb: error.config.method,
      code: error.response?.status,
      message: error.message,
    })
  )
}
