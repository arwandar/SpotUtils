import { AxiosError } from 'axios'
import { startOfToday } from 'date-fns'
import { Op } from 'sequelize'

import Error from '../models/Error.model'

// eslint-disable-next-line import/prefer-default-export
export const addError = async (error: AxiosError) =>
  Error.create({
    code: error.response?.status,
    message: error.message,
    url: error.config.url,
    config: JSON.stringify(error.config),
  })

export const getLastError = async () =>
  Error.findOne({
    attributes: ['url', 'code', 'message', 'createdAt'],
    order: [['createdAt', 'DESC']],
  })

export const getErrorsNb = async () =>
  Error.count({
    where: {
      createdAt: {
        [Op.gte]: startOfToday(),
      },
    },
  })
