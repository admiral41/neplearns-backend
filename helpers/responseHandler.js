var sendSuccessResponse = async ({ res, status = 200, msg = null, data = null, totalData = null, totalPage = null, token = null }) => {
  var response = {
    status: status,
    success: true,
  }
  if (token != null) response.token = token
  msg ? (response.msg = msg) : ''
  data ? (response.data = data) : ''
  totalData ? (response.totalData = totalData) : ''
  totalPage ? (response.totalPage = totalPage) : ''
  res.status(status).send(response)
}

var sendErrorResponse = ({ res, status = 500, msg = null, err = null }) => {
  var response = {
    status: status,
    success: false,
  }

  if (msg) response.msg = msg
  if (err) response.err = err

  res.status(status).send(response)
}

var sendQueryResponse = async ({ model, page, size, sortQuery, searchQuery, selectQuery, populate }) => {
  try {
    let data = await model
      .find(searchQuery)
      .select(selectQuery)
      .sort(sortQuery)
      .skip((page - 1) * size)
      .limit(size)
      .populate(populate)
      .lean()

    // Add finalPrice for courses (since .lean() skips virtuals)
    if (model.modelName === 'Course') {
      data = data.map(course => ({
        ...course,
        finalPrice: course.learn_type === 'FREE' ? 0 : course.price - (course.price * (course.discount || 0) / 100)
      }))
    }

    const totalData = await model.countDocuments(searchQuery)
    const totalPage = Math.ceil(totalData / size)

    return { data, totalData, totalPage }
  } catch (err) {
    throw err
  }
}


// var sendPaginationResponse = async ({ res, status = 200, data = null, msg = null, page_number = null, page_size = null, total_data = null, sort = null }) => {
//     const response = {
//         status: status,
//         success: true
//     };
//     msg ? response.msg = msg : response.msg = "No msg";
//     data ? response.data = data : response.data = {};
//     if (page_number) response.page = page_number;
//     if (page_size) response.size = page_size;
//     if (sort) response.sort = sort;
//     if (typeof total_data === 'number') response.totaldata = total_data;

//     return res.status(status).send(response);
// };

var parseFilters = (req, defaults) => {
  const size_default = defaults ? defaults : 10
  let page
  let size
  let sortQuery = { _id: -1 }
  let sort_key
  let searchQuery = {}
  let populate = []
  let selectQuery = ''
  // if (is_deleted === undefined) {
  // } else if (is_deleted === null) {
  // } else {
  //     if (!isNaN(is_deleted)) {
  //         searchQuery = { ...searchQuery, is_deleted: is_deleted };
  //         selectQuery = { ...selectQuery, is_deleted: 0, deleted_at: 0, deleted_by: 0 };
  //     }
  // }
  if (req.query.page && !isNaN(req.query.page) && req.query.page != 0) {
    page = Math.abs(req.query.page)
  } else {
    page = 1
  }
  if (req.query.size && !isNaN(req.query.size) && req.query.size != 0) {
    size = Math.abs(req.query.size)
  } else {
    size = size_default
  }
  if (req.query.sort) {
    let sort = req.query.sort.split(':')
    sort_key = sort[0]

    let sort_order = sort[1] === 'desc' ? -1 : 1
    sortQuery = { [sort_key]: sort_order }
  }
  if (req.query.searchQuery) {
  }
  return { page, size, sortQuery, searchQuery, selectQuery, populate }
}

module.exports = {
  sendSuccessResponse,
  sendErrorResponse,
  // sendPaginationResponse,
  sendQueryResponse,
  parseFilters,
}
