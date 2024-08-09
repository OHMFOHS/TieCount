const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 配置MySQL连接
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'mjc12345',
    database: 'mimi2'
});

db.connect((err) => {
    if (err) {
        throw err;
    }
    console.log('MySQL Connected...');
});

// 根据员工名字查询员工ID的辅助函数
function getEmployeeIDByName(name, callback) {
    let sql = 'SELECT EmployeeID FROM Employees WHERE Name = ?';
    db.query(sql, [name], (err, results) => {
        if (err) return callback(err, null);
        if (results.length > 0) {
            return callback(null, results[0].EmployeeID);
        } else {
            return callback(new Error('未找到该员工'), null);
        }
    });
}

// 获取从事某步骤的员工列表
app.get('/employees/:stepID', (req, res) => {
    const stepID = req.params.stepID;
    let sql = `
        SELECT e.EmployeeID, e.Name 
        FROM Employees e
        JOIN EmployeeSteps es ON e.EmployeeID = es.EmployeeID
        WHERE es.StepID = ?
    `;
    db.query(sql, [stepID], (err, results) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.json(results);
    });
});



app.post('/add-workflow', (req, res) => {
    let workflow = {
        CarJiaoEmployeeID: req.body.CarJiaoEmployeeID,
        TangJiaoEmployeeID: req.body.TangJiaoEmployeeID,
        TangShenEmployeeID: req.body.TangShenEmployeeID,
        FengShenEmployeeID: req.body.FengShenEmployeeID,
        ShangBiaoEmployeeID: req.body.ShangBiaoEmployeeID,
        Quantity: req.body.Quantity
    };

    let sql = 'INSERT INTO Workflow SET ?';
    db.query(sql, workflow, (err, result) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.send(`
            <html>
                <head>
                    <title>成功添加计件</title>
                </head>
                <body>
                    <h1>成功添加计件!</h1>
                    <button onclick="window.location.href='/'">继续添加</button>
                </body>
            </html>
        `);
    });
});




// // 创建新的登记卡信息
// app.post('/add-workflow', (req, res) => {
//     let names = [
//         req.body.CarJiaoEmployeeName,
//         req.body.TangJiaoEmployeeName,
//         req.body.TangShenEmployeeName,
//         req.body.FengShenEmployeeName,
//         req.body.ShangBiaoEmployeeName
//     ];
//
//     let workflow = {};
//
//     // 查询所有员工ID
//     let queryPromises = names.map(name => {
//         return new Promise((resolve, reject) => {
//             getEmployeeIDByName(name, (err, id) => {
//                 if (err) return reject(err);
//                 resolve(id);
//             });
//         });
//     });
//
//     Promise.all(queryPromises)
//         .then(ids => {
//             workflow.CarJiaoEmployeeID = ids[0];
//             workflow.TangJiaoEmployeeID = ids[1];
//             workflow.TangShenEmployeeID = ids[2];
//             workflow.FengShenEmployeeID = ids[3];
//             workflow.ShangBiaoEmployeeID = ids[4];
//             workflow.Quantity = req.body.Quantity;
//
//             let sql = 'INSERT INTO Workflow SET ?';
//             db.query(sql, workflow, (err, result) => {
//                 if (err) {
//                     return res.status(500).send(err);
//                 }
//                 res.send(`
//                     <html>
//                         <head>
//                             <title>添加一张记录</title>
//                         </head>
//                         <body>
//                             <h1>成功添加记录!</h1>
//                             <button onclick="window.location.href='/'">返回上级</button>
//                         </body>
//                     </html>
//                 `);
//             });
//         })
//         .catch(err => {
//             res.status(500).send(err.message);
//         });
// });

// 提供一个简单的HTML表单页面
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// 获取所有工序列表
app.get('/steps', (req, res) => {
    let sql = 'SELECT StepID, StepName FROM Steps';
    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.json(results);
    });
});

// 添加新员工并关联工序
app.post('/add-employee', (req, res) => {
    let newEmployee = {
        Name: req.body.Name
    };

    let sql = 'INSERT INTO Employees SET ?';
    db.query(sql, newEmployee, (err, result) => {
        if (err) {
            return res.status(500).send(err);
        }

        let employeeID = result.insertId;
        let steps = req.body.steps;

        // 如果 steps 不是数组，将其转换为数组
        if (!Array.isArray(steps)) {
            steps = [steps];
        }

        if (steps && steps.length > 0) {
            let stepValues = steps.map(stepID => [employeeID, stepID]);
            let stepSql = 'INSERT INTO EmployeeSteps (EmployeeID, StepID) VALUES ?';

            db.query(stepSql, [stepValues], (err, stepResult) => {
                if (err) {
                    return res.status(500).send(err);
                }
                res.send(`
                    <html>
                        <head>
                            <title>Employee Added</title>
                        </head>
                        <body>
                            <h1>成功添加员工!</h1>
                           <button onclick="window.location.href='/add-employee'">返回上级</button>
                        </body>
                    </html>
                `);
            });
        } else {
            res.send(`
                <html>
                    <head>
                        <title>Employee Added</title>
                    </head>
                    <body>
                        <h1>成功添加员工!</h1>
                        <button onclick="window.location.href='/add-employee'">返回上级</button>
                    </body>
                </html>
            `);
        }
    });
});


// // 添加新员工
// app.post('/add-employee', (req, res) => {
//     let newEmployee = {
//         Name: req.body.Name
//     };
//
//     let sql = 'INSERT INTO Employees SET ?';
//     db.query(sql, newEmployee, (err, result) => {
//         if (err) {
//             return res.status(500).send(err);
//         }
//         res.send(`
//                     <html>
//                         <head>
//                             <title>添加员工</title>
//                         </head>
//                         <body>
//                             <h1>成功添加员工!</h1>
//                             <button onclick="window.location.href='/add-employee'">返回上级</button>
//                         </body>
//                     </html>
//                 `);
//     });
// });


// 提供一个添加员工的HTML页面
app.get('/add-employee', (req, res) => {
    res.sendFile(__dirname + '/add-employee.html');
});


// 查询所有员工的件数记录和所有单子加在一起的总数量
app.get('/employee-stats', (req, res) => {
    let sql = `
        SELECT e.Name, '车角' AS StepName, SUM(w.Quantity) AS PieceCount
        FROM Workflow w
        JOIN Employees e ON w.CarJiaoEmployeeID = e.EmployeeID
        GROUP BY e.Name
        UNION
        SELECT e.Name, '烫角' AS StepName, SUM(w.Quantity) AS PieceCount
        FROM Workflow w
        JOIN Employees e ON w.TangJiaoEmployeeID = e.EmployeeID
        GROUP BY e.Name
        UNION
        SELECT e.Name, '烫身' AS StepName, SUM(w.Quantity) AS PieceCount
        FROM Workflow w
        JOIN Employees e ON w.TangShenEmployeeID = e.EmployeeID
        GROUP BY e.Name
        UNION
        SELECT e.Name, '缝身' AS StepName, SUM(w.Quantity) AS PieceCount
        FROM Workflow w
        JOIN Employees e ON w.FengShenEmployeeID = e.EmployeeID
        GROUP BY e.Name
        UNION
        SELECT e.Name, '商标' AS StepName, SUM(w.Quantity) AS PieceCount
        FROM Workflow w
        JOIN Employees e ON w.ShangBiaoEmployeeID = e.EmployeeID
        GROUP BY e.Name
        ORDER BY Name, StepName;
    `;

    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).send(err);
        }

        let totalQuantitySql = 'SELECT SUM(Quantity) AS TotalQuantity FROM Workflow';

        db.query(totalQuantitySql, (err, totalResult) => {
            if (err) {
                return res.status(500).send(err);
            }

            res.json({
                employeeStats: results,
                totalQuantity: totalResult[0].TotalQuantity
            });
        });
    });
});


// 获取所有员工列表
app.get('/employees', (req, res) => {
    let sql = 'SELECT EmployeeID, Name FROM Employees';
    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.json(results);
    });
});



// 提供一个统计信息的HTML页面
app.get('/stats', (req, res) => {
    res.sendFile(__dirname + '/stats.html');
});







// 启动服务器
app.listen(3000, () => {
    console.log('Server running on port 3000');
});
