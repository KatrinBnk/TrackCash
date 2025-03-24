function initializeTransactionTable(options) {
    const {
        creatorId,
        getCategories,
        loadTransactionsCallback,
        queryBuilder,
        userRole = 'employee',
        showUserDetails = false,
        hideActions = false,
        downloadCSVCallback
    } = options;

    function loadTransactions() {
        const query = queryBuilder ? queryBuilder() : `creatorId=${creatorId}`;
        $.ajax({
            url: `/api/statistics/detailed?${query}`,
            method: 'GET',
            success: function (stats) {
                const tbody = $('#transactions-body');
                const noTransactionsDiv = $('.no-transactions');
                tbody.empty();
                noTransactionsDiv.removeClass('show');

                const transactions = stats.transactions;

                if (transactions && Array.isArray(transactions) && transactions.length > 0) {
                    transactions.forEach(tx => {
                        const canEdit = userRole === 'manager' ? tx.type === 'balance' : tx.type !== 'balance';
                        const row = `
                            <tr data-id="${tx.id}" data-type="${tx.type}" data-category-id="${tx.categoryId || ''}">
                                <td>${tx.id}</td>
                                <td data-date="${tx.date}">${new Date(tx.date).toLocaleDateString()}</td>
                                <td data-type="${tx.type}">${tx.type === 'income' ? 'Доход' : tx.type === 'expense' ? 'Расход' : 'Баланс'}</td>
                                <td>${tx.amount}</td>
                                <td data-category-id="${tx.categoryId || ''}">${tx.categoryName || '-'}</td>
                                <td>${tx.comment || '-'}</td>
                                ${showUserDetails ? `
                                    <td>${tx.userId || '-'}</td>
                                    <td>${tx.surname || '-'}</td>
                                    <td>${tx.name || '-'}</td>
                                    <td>${tx.patronymic || '-'}</td>
                                ` : ''}
                                ${!hideActions ? `
                                    <td class="actions">
                                        ${canEdit ? `
                                            <div class="action-buttons">
                                                <button class="edit-btn"><i class="fas fa-edit"></i></button>
                                                <button class="delete-btn"><i class="fas fa-trash"></i></button>
                                                <button class="save-btn"><i class="fas fa-save"></i></button>
                                                <button class="cancel-btn"><i class="fas fa-times"></i></button>
                                            </div>
                                        ` : ''}
                                    </td>
                                ` : ''}
                            </tr>
                        `;
                        tbody.append(row);
                    });
                } else {
                    noTransactionsDiv.addClass('show');
                }

                if (loadTransactionsCallback) {
                    loadTransactionsCallback(stats);
                }
            },
            error: function (xhr) {
                alert('Ошибка загрузки транзакций: ' + (xhr.responseJSON?.message || 'Неизвестная ошибка'));
            }
        });
    }

    $('#transactions-body').on('click', '.edit-btn', function () {
        const row = $(this).closest('tr');
        const actions = row.find('.actions');
        const id = row.data('id');

        const originalData = {
            date: row.find('td:eq(1)').data('date'),
            dateDisplay: row.find('td:eq(1)').text(),
            type: row.find('td:eq(2)').data('type'),
            typeDisplay: row.find('td:eq(2)').text(),
            amount: row.find('td:eq(3)').text(),
            category: row.find('td:eq(4)').text(),
            categoryId: row.find('td:eq(4)').data('category-id'),
            comment: row.find('td:eq(5)').text()
        };

        const dateCell = row.find('td:eq(1)');
        dateCell.html(`<input type="date" class="editable-date" value="${originalData.date}">`);

        const typeCell = row.find('td:eq(2)');
        const currentType = typeCell.data('type');
        typeCell.html(`
            <select class="editable-select type-select">
                <option value="income" ${currentType === 'income' ? 'selected' : ''}>Доход</option>
                <option value="expense" ${currentType === 'expense' ? 'selected' : ''}>Расход</option>
            </select>
        `);

        row.find('td:eq(3)').attr('contenteditable', true);
        row.find('td:eq(5)').attr('contenteditable', true);

        const categoryCell = row.find('td:eq(4)');
        const currentCategoryId = categoryCell.data('category-id') || '';
        let categoryOptions = '<option value="">Без категории</option>';
        const categories = getCategories(); // Получаем актуальные категории в момент редактирования
        categories.forEach(category => {
            categoryOptions += `<option  <option value="${category.id}" ${currentCategoryId == category.id ? 'selected' : ''}>${category.name}</option>`;
        });
        categoryCell.html(`<select class="editable-select category-select">${categoryOptions}</select>`);

        actions.addClass('editing');

        actions.find('.save-btn').off('click').on('click', function () {
            const updatedData = {
                date: row.find('.editable-date').val(),
                type: row.find('.type-select').val(),
                amount: parseFloat(row.find('td:eq(3)').text().trim()),
                categoryId: row.find('.category-select').val() || null,
                comment: row.find('td:eq(5)').text().trim() === '-' ? null : row.find('td:eq(5)').text().trim()
            };

            if (!updatedData.date || isNaN(updatedData.amount) || updatedData.amount <= 0) {
                alert('Укажите корректные дату и сумму!');
                return;
            }

            $.ajax({
                url: `/api/transactions/${id}`,
                method: 'PUT',
                contentType: 'application/json',
                data: JSON.stringify(updatedData),
                success: function (response) {
                    alert(response.message);
                    actions.removeClass('editing');
                    row.find('td').attr('contenteditable', false);
                    loadTransactions();
                },
                error: function (xhr) {
                    alert('Ошибка: ' + (xhr.responseJSON?.message || 'Неизвестная ошибка'));
                }
            });
        });

        actions.find('.cancel-btn').off('click').on('click', function () {
            actions.removeClass('editing');
            row.find('td:eq(1)').html(originalData.dateDisplay);
            row.find('td:eq(1)').data('date', originalData.date);
            row.find('td:eq(2)').text(originalData.typeDisplay);
            row.find('td:eq(2)').data('type', originalData.type);
            row.find('td:eq(3)').text(originalData.amount);
            row.find('td:eq(4)').text(originalData.category);
            row.find('td:eq(4)').data('category-id', originalData.categoryId);
            row.find('td:eq(5)').text(originalData.comment);
            row.find('td').attr('contenteditable', false);
        });
    });

    $('#transactions-body').on('click', '.delete-btn', function () {
        const row = $(this).closest('tr');
        const transactionId = row.data('id');

        if (confirm('Вы уверены, что хотите удалить эту транзакцию?')) {
            $.ajax({
                url: `/api/transactions/${transactionId}`,
                method: 'DELETE',
                success: function () {
                    alert('Транзакция успешно удалена');
                    loadTransactions();
                },
                error: function (xhr) {
                    alert('Ошибка: ' + (xhr.responseJSON?.message || 'Неизвестная ошибка'));
                }
            });
        }
    });

    loadTransactions();

    return {
        refresh: loadTransactions
    };
}