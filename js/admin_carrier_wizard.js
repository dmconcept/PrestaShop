/*
* 2007-2013 PrestaShop
*
* NOTICE OF LICENSE
*
* This source file is subject to the Academic Free License (AFL 3.0)
* that is bundled with this package in the file LICENSE.txt.
* It is also available through the world-wide-web at this URL:
* http://opensource.org/licenses/afl-3.0.php
* If you did not receive a copy of the license and are unable to
* obtain it through the world-wide-web, please send an email
* to license@prestashop.com so we can send you a copy immediately.
*
* DISCLAIMER
*
* Do not edit or add to this file if you wish to upgrade PrestaShop to newer
* versions in the future. If you wish to customize PrestaShop for your
* needs please refer to http://www.prestashop.com for more information.
*
*  @author PrestaShop SA <contact@prestashop.com>
*  @copyright  2007-2013 PrestaShop SA
*  @license    http://opensource.org/licenses/afl-3.0.php  Academic Free License (AFL 3.0)
*  International Registered Trademark & Property of PrestaShop SA
*/


$(document).ready(function() {
	validateAndAddRangeButtonDisplay();
	bind_inputs();
	initCarrierWizard();
	if (parseInt($('input[name="is_free"]:checked').val()))
		is_freeClick($('input[name="is_free"]:checked'));
	displayRangeType();
	
});

function initCarrierWizard()
{
	$("#carrier_wizard").smartWizard({
		'labelNext' : labelNext,
		'labelPrevious' : labelPrevious,
		'labelFinish' : labelFinish,
		'fixHeight' : 1,
		'onShowStep' : onShowStepCallback,
		'onLeaveStep' : onLeaveStepCallback,
		'onFinish' : onFinishCallback,
		'transitionEffect' : 'slideleft',
		'enableAllSteps' : enableAllSteps
	});
	displayRangeType();
}

function displayRangeType()
{
	if ($('input[name="shipping_method"]:checked').val() == 1)
	{
		string = string_weight;
		$('.weight_unit').show();
		$('.price_unit').hide();
	}
	else
	{
		string = string_price;
		$('.price_unit').show();
		$('.weight_unit').hide();
	}
	
	$('.range_type').html(string);
}

function onShowStepCallback()
{
	$('.anchor li a').each( function () {
		$(this).parent('li').addClass($(this).attr('class'));
	});
	$('#carrier_logo_block').prependTo($('div.content').filter(function() { return $(this).css('display') != 'none' }).children('.defaultForm').children('fieldset'));
	resizeWizard();
}

function onFinishCallback(obj, context)
{
	$('.wizard_error').remove();
	$.ajax({
		type:"POST",
		url : validate_url,
		async: false,
		dataType: 'json',
		data : $('#carrier_wizard .stepContainer .content form').serialize() + '&action=finish_step&ajax=1',
		success : function(data) {
			if (data.has_error)
			{				
				displayError(data.errors, context.fromStep);
				resizeWizard();
			}
			else
				window.location.href = carrierlist_url;
		}
	});
}

function onLeaveStepCallback(obj, context)
{
	if (context.toStep == nbr_steps)
		displaySummary();
	
	return validateSteps(context.fromStep); // return false to stay on step and true to continue navigation 
}

function displaySummary()
{
	// used as buffer - you must not replace directly in the translation vars
	var tmp;

	// Carrier name
	$('#summary_name').html($('#name').val());
	
	// Delay and pricing
	tmp = summary_translation_meta_informations.replace('@s2', '<strong>' + $('#delay_1').val() + '</strong>');
	if ($('#is_free_on').attr('checked'))
		tmp = tmp.replace('@s1', summary_translation_free);
	else
		tmp = tmp.replace('@s1', summary_translation_paid);
	$('#summary_meta_informations').html(tmp);
	
	// Tax and calculation mode for the shipping cost
	tmp = summary_translation_shipping_cost.replace('@s2', '<strong>' + $('#id_tax_rules_group option:selected').text() + '</strong>');	
	if ($('#billing_price').attr('checked'))
		tmp = tmp.replace('@s1', summary_translation_price);
	else if ($('#billing_weight').attr('checked'))
		tmp = tmp.replace('@s1', summary_translation_weight);
	else
		tmp = tmp.replace('@s1', '<strong>' + summary_translation_undefined + '</strong>');
	$('#summary_shipping_cost').html(tmp);
	
	// Weight or price ranges
	$('#summary_range').html(summary_translation_range);
	var range_inf = summary_translation_undefined;
	var range_sup = summary_translation_undefined;
	
	/*
$('input[name$="range_inf[]"]').each(function(){
		if (!isNaN(parseFloat($(this).val())) && (range_inf == summary_translation_undefined || range_inf < $(this).val()))
			range_inf = $(this).val();
	});
*/
	range_inf = $('tr.range_inf td input:first').val(); 
	range_sup = $('tr.range_sup td input:last').val();

	$('input[name$="range_sup[]"]').each(function(){
		if (!isNaN(parseFloat($(this).val())) && (range_sup == summary_translation_undefined || range_sup > $(this).val()))
			range_sup = $(this).val();
	});
	$('#summary_range').html(
		$('#summary_range').html()
		.replace('@s1', '<strong>' + range_inf + '</strong>')
		.replace('@s2', '<strong>' + range_sup + '</strong>')
		.replace('@s3', '<strong>' + $('#range_behavior option:selected').text().toLowerCase() + '</strong>')
	);
	
	// Delivery zones
	$('#summary_zones').html('');
	$('.input_zone').each(function(){
		if ($(this).attr('checked'))
			$('#summary_zones').html($('#summary_zones').html() + '<li><strong>' + $(this).parent().prev().text() + '</strong></li>');
	});
	
	// Group restrictions
	$('#summary_groups').html('');
	$('input[name$="groupBox[]"]').each(function(){
		if ($(this).attr('checked'))
			$('#summary_groups').html($('#summary_groups').html() + '<li><strong>' + $(this).parent().next().next().text() + '</strong></li>');
	});
	
	// shop restrictions
	$('#summary_shops').html('');
	$('.input_shop').each(function(){
		if ($(this).attr('checked'))
			$('#summary_shops').html($('#summary_shops').html() + '<li><strong>' + $(this).parent().text() + '</strong></li>');
	});
}

function validateSteps(step_number)
{
	$('.wizard_error').remove();
	var is_ok = true;
	form = $('#carrier_wizard #step-'+step_number+' form');
	$.ajax({
		type:"POST",
		url : validate_url,
		async: false,
		dataType: 'json',
		data : form.serialize()+'&step_number='+step_number+'&action=validate_step&ajax=1',
		success : function(datas)
		{
			if (datas.has_error)
			{
				is_ok = false;
				
				$('input').focus( function () {
					$(this).removeClass('field_error');
				});
				displayError(datas.errors, step_number);
				resizeWizard();
			}
		}
	});
	return is_ok;
}

function displayError(errors, step_number)
{
	$('.wizard_error').remove();
	str_error = '<div class="error wizard_error" style="display:none"><span style="float:right"><a id="hideError" href="#"><img alt="X" src="../img/admin/close.png" /></a></span><ul>';
	for (var error in errors)
	{
		$('#carrier_wizard').smartWizard('setError',{stepnum:step_number,iserror:true});
		$('input[name="'+error+'"]').addClass('field_error');
		str_error += '<li>'+errors[error]+'</li>';
	}
	$('#step-'+step_number).prepend(str_error+'</ul></div>');
	$('.wizard_error').fadeIn('fast');
}

function resizeWizard()
{
	resizeInterval = setInterval(function (){$("#carrier_wizard").smartWizard('fixHeight'); clearInterval(resizeInterval)}, 100);
}

function bind_inputs()
{
	$('input').focus( function () {
		$(this).removeClass('field_error');
		$('.wizard_error').fadeOut('fast', function () { $(this).remove()});
	});
	
	$('tr.delete_range td button').off('click').on('click', function () {
		if (confirm(delete_range_confirm))
		{
			index = $(this).parent('td').index();
			$('tr.range_sup td:eq('+index+'), tr.range_inf td:eq('+index+'), tr.fees_all td:eq('+index+'), tr.delete_range td:eq('+index+')').remove();
			$('tr.fees').each( function () {
				$(this).children('td:eq('+index+')').remove();
			});
			rebuildTabindex();
		}
		return false;
	});
	
	$('#validate_range_button').off('click').on('click', function () {
		index = $('tr.fees_all td:last').index();
		if (validateRange(index))
		{
			enableRange(index);
			$('.currency_sign').show();
		}
		else
			disableRange(index);
		validateAndAddRangeButtonDisplay();
		return false;
	});
	
	$('tr.fees td input:checkbox').off('change').on('change', function () {
				
		if($(this).is(':checked'))
		{
			$(this).closest('tr').children('td').each( function () {
				index = $(this).index();
				if ($('tr.fees_all td:eq('+index+')').hasClass('validated'))
					$(this).children('input:text').removeAttr('disabled');
			});
		}
		else
			$(this).closest('tr').children('td').children('input:text').attr('disabled', 'disabled');
		return false;
	});
	
	$('tr.range_sup td input:text, tr.range_inf td input:text').focus( function () {
		$(this).removeClass('field_error');
	});
	
	$('tr.range_sup td input:text, tr.range_inf td input:text').off('change').on('change', function () {
		index = $(this).parent('td').index();
		if ($('tr.fees_all td:eq('+index+')').hasClass('validated') || $('tr.fees_all td:eq('+index+')').hasClass('not_validated'))
		{
			if (validateRange(index))
				enableRange(index);
			else
				disableRange(index);
		}
	});
	
	$(document.body).off('change', 'tr.fees_all td input').on('change', 'tr.fees_all td input', function() {
	   index = $(this).parent('td').index();
		val = $(this).val();
		$(this).val('');
		$('tr.fees').each( function () {
			$(this).find('td:eq('+index+') input:text:enabled').val(val);
		});
		
		return false;
	});
	
	$('input[name="is_free"]').off('click').on('click', function() {
		is_freeClick(this);
	});
		
	$('input[name="shipping_method"]').off('click').on('click', function() {
		$.ajax({
			type:"POST",
			url : validate_url,
			async: false,
			dataType: 'html',
			data : 'id_carrier='+parseInt($('#id_carrier').val())+'&shipping_method='+parseInt($(this).val())+'&action=changeRanges&ajax=1',
			success : function(data) {
				$('#zone_ranges').replaceWith(data);
				displayRangeType();
				bind_inputs();
			}
		});
	});
	
	$('#zones_table td input[type=text]').off('change').on('change', function () {
		checkAllFieldIsNumeric();
	});	
}

function is_freeClick(elt)
{
	var is_free = $(elt);

	if (parseInt(is_free.val()))
		hideFees();
	else
		showFees();
}

function hideFees()
{
	$('tr.range_inf td, tr.range_sup td, tr.fees_all td, tr.fees td').each( function () {
		if ($(this).index() >= 2)
		{
			$(this).find('input:text, button').val('').attr('disabled', 'disabled').css('background-color', '#999999').css('border-color', '#999999');
			$(this).css('background-color', '#999999');
		}
	});
}

function showFees()
{
	$('tr.range_inf td, tr.range_sup td, tr.fees_all td, tr.fees td').each( function () {
		if ($(this).index() >= 2)
		{
			//enable only if zone is active
			tr = $(this).parent('tr');
			if ($(tr).index() > 2 && $(tr).find('td:eq(1) input').attr('checked') && $('tr.fees_all td:eq('+$(this).index()+')').hasClass('validated') || $(tr).hasClass('range_sup') || $(tr).hasClass('range_inf'))
					$(this).find('input:text').val('').removeAttr('disabled');
			
			$(this).find('input:text, button').css('background-color', '').css('border-color', '');
			$(this).find('button').css('background-color', '').css('border-color', '').removeAttr('disabled');
			$(this).css('background-color', '');
		}
	});
}

function validateRange(index)
{
	//reset error css
	$('tr.range_sup td input:text').removeClass('field_error');
	$('tr.range_inf td input:text').removeClass('field_error');
	
	is_ok = true;
	range_sup = parseFloat($('tr.range_sup td:eq('+index+')').children('input:text').val().trim());
	range_inf = parseFloat($('tr.range_inf td:eq('+index+')').children('input:text').val().trim());

	if (isNaN(range_sup) || range_sup.length === 0)
	{
		$('tr.range_sup td:eq('+index+')').children('input:text').addClass('field_error');
		is_ok = false;
		displayError([invalid_range], $("#carrier_wizard").smartWizard('currentStep'));
	}
	else if (is_ok && (isNaN(range_inf) || range_inf.length === 0))
	{
		$('tr.range_inf td:eq('+index+')').children('input:text').addClass('field_error');
		is_ok = false;
		displayError([invalid_range], $("#carrier_wizard").smartWizard('currentStep'));
	}
	else if (is_ok && range_inf >= range_sup)
	{
		$('tr.range_sup td:eq('+index+')').children('input:text').addClass('field_error');
		$('tr.range_inf td:eq('+index+')').children('input:text').addClass('field_error');
		is_ok = false;
		displayError([invalid_range], $("#carrier_wizard").smartWizard('currentStep'));
	}
	else if (is_ok && index > 2)//check range only if it's not the first range
	{	
		is_ok = false;
		$('tr.range_sup td').not('.range_type, .range_sign, tr.range_sup td:last').each( function () 
		{
			index = $(this).index();
			current_val = $(this).find('input').val();
			if ((range_inf >= current_val) && (($('tr.range_inf td:eq('+index+1+')').length && range_inf <= $('tr.range_inf td:eq('+index+1+') input').val()) || !$('tr.range_inf td:eq('+index+1+')').length))
			{
				if (range_sup >= $('tr.range_inf td:eq('+index+') input').val() && ($('tr.range_inf td:eq('+index+1+')').length && range_sup < $('tr.range_inf td:eq('+index+1+') input').val() || !$('tr.range_inf td:eq('+index+1+')').length ))
					is_ok = true;
			}
		});
		
		if (!is_ok)
		{
			$('tr.range_sup td:eq('+index+')').children('input:text').addClass('field_error');
			$('tr.range_inf td:eq('+index+')').children('input:text').addClass('field_error');
			displayError([range_is_overlapping], $("#carrier_wizard").smartWizard('currentStep'));
		}
	}
	return is_ok;
}

function enableRange(index)
{
	$('tr.fees').each( function () {
		//only enable fees for enabled zones
		if ($(this).children('td').children('input:checkbox').attr('checked') == 'checked')
			$(this).children('td:eq('+index+')').children('input').removeAttr('disabled');
	});
	$('span.fees_all').show();
	$('tr.fees_all td:eq('+index+')').children('input').show().removeAttr('disabled');
	$('tr.fees_all td:eq('+index+')').children('.currency_sign').show();
	$('tr.fees_all td:eq('+index+')').addClass('validated').removeClass('not_validated');
	$('tr.fees_all td:eq('+index+')').children('button').remove();
	bind_inputs();
}

function disableRange(index)
{
	$('tr.fees').each( function () {
		//only enable fees for enabled zones
		if ($(this).children('td').children('input:checkbox').attr('checked') == 'checked')
			$(this).children('td:eq('+index+')').children('input').attr('disabled', 'disabled');
	});
	$('tr.fees_all td:eq('+index+')').children('input').attr('disabled', 'disabled');
	$('tr.fees_all td:eq('+index+')').removeClass('validated').addClass('not_validated');
}

function add_new_range()
{
	if (!$('tr.fees_all td:last').hasClass('validated'))
	{
		alert(need_to_validate);
		return false;
	}
	
	last_sup_val = $('tr.range_sup td:last input').val();
	//add new rand sup input
	$('tr.range_sup td:last').after('<td class="center"><input name="range_sup[]" type="text" /><sup>*</sup><span class="weight_unit" style="display: none;">&nbsp; '+PS_WEIGHT_UNIT+'</span><span class="price_unit" style="display: none;">&nbsp; '+currency_sign+'</span></td>');
	//add new rand inf input
	$('tr.range_inf td:last').after('<td class="border_bottom center"><input name="range_inf[]" type="text" value="'+last_sup_val+'" /><sup>*</sup><span class="weight_unit" style="display: none;">&nbsp; '+PS_WEIGHT_UNIT+'</span><span class="price_unit" style="display: none;">&nbsp; '+currency_sign+'</span></td>');
	
	$('tr.fees_all td:last').after('<td class="center border_top border_bottom"><input style="display:none" type="text" /><span class="currency_sign" style="display:none" >&nbsp;'+currency_sign+'</span></td>');

	$('tr.fees').each( function () {
		$(this).children('td:last').after('<td class="center"><input disabled="disabled" name="fees['+$(this).data('zoneid')+'][]" type="text" /> &nbsp; '+currency_sign+'</td>');
	});
	$('tr.delete_range td:last').after('<td class="center"><button class="button">'+labelDelete+'</button</td>');
	
	validateAndAddRangeButtonDisplay();
	bind_inputs();
	rebuildTabindex();
	displayRangeType();
	resizeWizard();
	return false;
}

function delete_new_range()
{
	if ($('#new_range_form_placeholder').children('td').length = 1)
		return false;
}

function checkAllFieldIsNumeric()
{
	$('#zones_table td input[type=text]').each( function () {
		if (!$.isNumeric($(this).val()) && $(this).val() != '')
			$(this).addClass('field_error');
	});
}

function checkRangeContinuity()
{
	

}

function rebuildTabindex()
{
	i = 1;
	$('#zones_table tr').each( function () 
	{	
		j = i;
		$(this).children('td').each( function () 
		{
			j = zones_nbr + j;
			if ($(this).index() >= 2 && $(this).find('input'))
				$(this).find('input').attr('tabindex', j);
		});
		i++;
	});
}

function validateAndAddRangeButtonDisplay()
{
	if ($('tr.fees_all td:last').hasClass('validated'))
	{
		$('.validate_range').hide();
		$('.new_range').show();
	}
	else
	{
		$('.validate_range').show();
		$('.new_range').hide();
	}
}